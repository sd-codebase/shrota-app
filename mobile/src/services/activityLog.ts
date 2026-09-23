import { AppState, AppStateStatus, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';

import { API_URL } from '../config';

const INSTALL_ID_KEY = '@shrota/activity/install_id';
const QUEUE_KEY = '@shrota/activity/queue';
const SESSIONS_KEY = '@shrota/activity/sessions';
// Must match the key AuthContext writes the user token under.
const AUTH_TOKEN_KEY = '@shrota_auth_token';

const FLUSH_INTERVAL_MS = 30000;
const FLUSH_AT_QUEUE_SIZE = 25;
const MAX_BATCH = 200;
// Events are dropped oldest-first past this, so a device that is offline
// for days can't grow the queue without bound.
const MAX_QUEUE = 2000;
// Returning to the app after longer than this counts as a new session
// rather than a continuation of the old one.
const SESSION_RESUME_GRACE_MS = 30 * 60 * 1000;

interface SessionMeta {
  session_id: string;
  install_id: string;
  started_at: string;
  ended_at: string | null;
  platform: string;
  os_version: string;
  device_model: string | null;
  app_version: string | null;
}

interface QueuedEvent {
  event_id: string;
  session_id: string;
  event_name: string;
  occurred_at: string;
  params?: Record<string, unknown>;
}

// Not security-sensitive — these ids only need to be collision-free.
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

class ActivityLogger {
  private installId: string | null = null;
  private currentSessionId: string | null = null;
  private backgroundedAt: number | null = null;

  // Keyed by session id. Retained until that session's events have all
  // been delivered, so a batch sent after a restart still carries the
  // session it actually belongs to.
  private sessions: Record<string, SessionMeta> = {};
  private queue: QueuedEvent[] = [];

  private enabled = true;
  private initialised = false;
  private flushing = false;
  // Until stored state has been merged in, writing would clobber the
  // previous run's buffered events with whatever this run has so far.
  private loaded = false;
  private persistChain: Promise<void> = Promise.resolve();
  private timer: ReturnType<typeof setInterval> | null = null;
  private appStateSub: { remove: () => void } | null = null;

  async init() {
    if (this.initialised) return;
    this.initialised = true;

    try {
      let installId = await AsyncStorage.getItem(INSTALL_ID_KEY);
      if (!installId) {
        installId = uuid();
        await AsyncStorage.setItem(INSTALL_ID_KEY, installId);
      }
      this.installId = installId;

      // Anything still pending from a previous run (killed app, no
      // network) is recovered here rather than lost.
      const [storedQueue, storedSessions] = await Promise.all([
        AsyncStorage.getItem(QUEUE_KEY),
        AsyncStorage.getItem(SESSIONS_KEY),
      ]);

      if (storedSessions) {
        try {
          const parsed = JSON.parse(storedSessions);
          if (parsed && typeof parsed === 'object') {
            this.sessions = { ...parsed, ...this.sessions };
          }
        } catch {
          await AsyncStorage.removeItem(SESSIONS_KEY);
        }
      }

      if (storedQueue) {
        try {
          const parsed = JSON.parse(storedQueue);
          // Prepend rather than assign: callers track events while this
          // await is still pending, and those must not be clobbered.
          if (Array.isArray(parsed)) this.queue = [...parsed, ...this.queue];
        } catch {
          await AsyncStorage.removeItem(QUEUE_KEY);
        }
      }
    } catch (error) {
      console.log('ActivityLog init error:', error);
    }

    // Events tracked before init finished have no session yet; adopt them
    // into the session starting now.
    const session = this.startSession();
    for (const event of this.queue) {
      if (!event.session_id) event.session_id = session;
    }

    this.loaded = true;
    await this.persist();

    this.timer = setInterval(() => {
      this.flush();
    }, FLUSH_INTERVAL_MS);

    this.appStateSub = AppState.addEventListener('change', this.onAppStateChange);

    // Send whatever the previous run left behind as soon as we're up.
    this.flush();
  }

  private startSession(): string {
    const sessionId = uuid();
    this.currentSessionId = sessionId;
    this.sessions[sessionId] = {
      session_id: sessionId,
      install_id: this.installId ?? '',
      started_at: new Date().toISOString(),
      ended_at: null,
      platform: Platform.OS,
      os_version: String(Platform.Version),
      device_model: (Platform.constants as { Model?: string })?.Model ?? null,
      app_version: Application.nativeApplicationVersion ?? null,
    };
    return sessionId;
  }

  private onAppStateChange = (state: AppStateStatus) => {
    const current = this.currentSessionId ? this.sessions[this.currentSessionId] : null;

    if (state === 'background' || state === 'inactive') {
      if (this.backgroundedAt !== null) return;
      // The app may never come back, so close the session off and get
      // everything on the wire now.
      // Literal rather than AnalyticsEvents.* to keep this module free of
      // a circular import back through the Analytics facade.
      this.track('app_backgrounded');
      if (current) current.ended_at = new Date().toISOString();
      this.backgroundedAt = Date.now();
      this.flush();
      return;
    }

    if (state === 'active' && this.backgroundedAt !== null) {
      const away = Date.now() - this.backgroundedAt;
      this.backgroundedAt = null;
      if (away > SESSION_RESUME_GRACE_MS) {
        this.startSession();
        this.track('app_opened');
      } else if (current) {
        current.ended_at = null;
      }
    }
  };

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  track(eventName: string, params?: Record<string, unknown>) {
    if (!this.enabled) return;
    if (!this.initialised) {
      // Very early events (before init resolves) still matter — queue them
      // and init will attach the session id once it exists.
      this.init();
    }

    this.queue.push({
      event_id: uuid(),
      session_id: this.currentSessionId ?? '',
      event_name: eventName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 60),
      occurred_at: new Date().toISOString(),
      params,
    });

    if (this.queue.length > MAX_QUEUE) {
      this.queue = this.queue.slice(-MAX_QUEUE);
    }

    this.persist();

    if (this.queue.length >= FLUSH_AT_QUEUE_SIZE) {
      this.flush();
    }
  }

  /**
   * Writes are chained rather than fired off concurrently, and the state
   * is serialised at write time. Overlapping writes would otherwise land
   * out of order and an earlier, shorter queue could overwrite a later
   * one — silently losing buffered events.
   */
  private persist(): Promise<void> {
    if (!this.loaded) return this.persistChain;
    this.persistChain = this.persistChain
      .then(async () => {
        await AsyncStorage.multiSet([
          [QUEUE_KEY, JSON.stringify(this.queue)],
          [SESSIONS_KEY, JSON.stringify(this.sessions)],
        ]);
      })
      .catch((error) => {
        console.log('ActivityLog persist error:', error);
      });
    return this.persistChain;
  }

  /**
   * Called on login so the backend can attribute this session — including
   * everything already logged anonymously — to the user.
   */
  async identify() {
    await this.flush();
  }

  async flush(): Promise<void> {
    if (!this.enabled || this.flushing) return;
    if (!this.installId) return;

    // One batch per session, so events queued during an earlier run are
    // still delivered under the session they belong to.
    const bySession = new Map<string, QueuedEvent[]>();
    for (const event of this.queue) {
      if (!event.session_id) continue;
      const existing = bySession.get(event.session_id);
      if (existing) existing.push(event);
      else bySession.set(event.session_id, [event]);
    }

    // A session that just ended still needs a final call so ended_at (and
    // any pending user attribution) reaches the server.
    const current = this.currentSessionId ? this.sessions[this.currentSessionId] : null;
    if (current && !bySession.has(current.session_id) && current.ended_at) {
      bySession.set(current.session_id, []);
    }

    if (bySession.size === 0) return;

    this.flushing = true;
    try {
      const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;

      for (const [sessionId, events] of bySession) {
        const meta = this.sessions[sessionId];
        if (!meta) {
          // Session metadata is gone (storage cleared mid-flight); the
          // events can't be attributed, so drop them rather than loop.
          this.queue = this.queue.filter((e) => e.session_id !== sessionId);
          continue;
        }

        const batch = events.slice(0, MAX_BATCH);
        const response = await fetch(`${API_URL}/activity/ingest`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            session: { ...meta, install_id: meta.install_id || this.installId },
            events: batch.map(({ session_id, ...e }) => e),
          }),
        });

        if (!response.ok) {
          // Leave this session's events queued. Event ids are stable, so a
          // later retry is de-duplicated server-side rather than doubled.
          continue;
        }

        const sent = new Set(batch.map((e) => e.event_id));
        this.queue = this.queue.filter((e) => !sent.has(e.event_id));

        // Finished sessions with nothing left queued can be forgotten.
        const remaining = this.queue.some((e) => e.session_id === sessionId);
        if (!remaining && meta.ended_at && sessionId !== this.currentSessionId) {
          delete this.sessions[sessionId];
        }
      }

      await this.persist();
    } catch (e) {
      // Offline — keep the queue for the next attempt.
    } finally {
      this.flushing = false;
    }
  }

  /** Test/debug helper: what is currently buffered and under which session. */
  getState() {
    return {
      sessionId: this.currentSessionId,
      installId: this.installId,
      queued: this.queue.length,
      pendingSessions: Object.keys(this.sessions).length,
    };
  }

  teardown() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.appStateSub?.remove();
    this.appStateSub = null;
  }
}

export const ActivityLog = new ActivityLogger();
