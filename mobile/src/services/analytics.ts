import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';

// Event names for type safety
export const AnalyticsEvents = {
  // Authentication
  USER_REGISTERED: 'user_registered',
  OTP_SENT: 'otp_sent',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',

  // Content Discovery
  SEARCH: 'search',
  FILTER_APPLIED: 'filter_applied',
  BOOK_VIEWED: 'book_viewed',
  SECTION_VIEWED: 'section_viewed',
  AUTHOR_VIEWED: 'author_viewed',
  ARTIST_VIEWED: 'artist_viewed',
  PUBLICATION_VIEWED: 'publication_viewed',
  GENRE_VIEWED: 'genre_viewed',

  // Playback
  PLAYBACK_STARTED: 'playback_started',
  PLAYBACK_PAUSED: 'playback_paused',
  PLAYBACK_RESUMED: 'playback_resumed',
  CHAPTER_COMPLETED: 'chapter_completed',
  BOOK_COMPLETED: 'book_completed',
  PLAYBACK_SPEED_CHANGED: 'playback_speed_changed',
  SEEK: 'seek',
  SLEEP_TIMER_SET: 'sleep_timer_set',

  // Engagement
  BOOK_LIKED: 'book_liked',
  BOOK_UNLIKED: 'book_unliked',
  DOWNLOAD_STARTED: 'download_started',
  DOWNLOAD_COMPLETED: 'download_completed',
  DOWNLOAD_DELETED: 'download_deleted',

  // Navigation
  SCREEN_VIEW: 'screen_view',
  TAB_SWITCHED: 'tab_switched',
  APP_OPENED: 'app_opened',
  APP_BACKGROUNDED: 'app_backgrounded',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

class AnalyticsService {
  private isEnabled: boolean = true;

  /**
   * Enable or disable analytics tracking
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    analytics().setAnalyticsCollectionEnabled(enabled);
    crashlytics().setCrashlyticsCollectionEnabled(enabled);
  }

  /**
   * Track a custom event with optional parameters
   */
  async track(eventName: string, params?: Record<string, any>) {
    if (!this.isEnabled) return;

    try {
      // Firebase event names must be alphanumeric with underscores
      const sanitizedName = eventName.replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 40);
      await analytics().logEvent(sanitizedName, params);
    } catch (error) {
      console.log('Analytics track error:', error);
    }
  }

  /**
   * Set user ID for analytics and crashlytics (call after login)
   */
  async identify(userId: string) {
    if (!this.isEnabled) return;

    try {
      await analytics().setUserId(userId);
      await crashlytics().setUserId(userId);
    } catch (error) {
      console.log('Analytics identify error:', error);
    }
  }

  /**
   * Clear user identity (call on logout)
   */
  async reset() {
    try {
      await analytics().setUserId(null);
      // Crashlytics doesn't have a reset method, but we can set to empty
    } catch (error) {
      console.log('Analytics reset error:', error);
    }
  }

  /**
   * Set a user property for segmentation
   */
  async setUserProperty(key: string, value: string | null) {
    if (!this.isEnabled) return;

    try {
      await analytics().setUserProperty(key, value);
      if (value) {
        await crashlytics().setAttribute(key, value);
      }
    } catch (error) {
      console.log('Analytics setUserProperty error:', error);
    }
  }

  /**
   * Track screen views
   */
  async screenView(screenName: string, screenClass?: string) {
    if (!this.isEnabled) return;

    try {
      await analytics().logScreenView({
        screen_name: screenName,
        screen_class: screenClass || screenName,
      });
    } catch (error) {
      console.log('Analytics screenView error:', error);
    }
  }

  /**
   * Log errors to Crashlytics
   */
  logError(error: Error, context?: string) {
    try {
      if (context) {
        crashlytics().log(context);
      }
      crashlytics().recordError(error);
    } catch (e) {
      console.log('Crashlytics logError error:', e);
    }
  }

  /**
   * Log a message to Crashlytics (for debugging)
   */
  log(message: string) {
    try {
      crashlytics().log(message);
    } catch (error) {
      console.log('Crashlytics log error:', error);
    }
  }

  // Convenience methods for common events

  async trackSearch(query: string, resultsCount: number) {
    await this.track(AnalyticsEvents.SEARCH, {
      query: query.substring(0, 100), // Limit query length
      results_count: resultsCount,
    });
  }

  async trackFilterApplied(filterType: string, value: string) {
    await this.track(AnalyticsEvents.FILTER_APPLIED, {
      filter_type: filterType,
      value: value.substring(0, 100),
    });
  }

  async trackBookViewed(bookId: string, source: 'search' | 'browse' | 'deeplink' | 'download') {
    await this.track(AnalyticsEvents.BOOK_VIEWED, {
      book_id: bookId,
      source,
    });
  }

  async trackPlaybackStarted(bookId: string, chapterIndex: number, source: 'book_details' | 'chapter_list' | 'resume') {
    await this.track(AnalyticsEvents.PLAYBACK_STARTED, {
      book_id: bookId,
      chapter_index: chapterIndex,
      source,
    });
  }

  async trackPlaybackPaused(bookId: string, position: number, duration: number) {
    await this.track(AnalyticsEvents.PLAYBACK_PAUSED, {
      book_id: bookId,
      position: Math.floor(position),
      duration: Math.floor(duration),
    });
  }

  async trackPlaybackResumed(bookId: string, position: number) {
    await this.track(AnalyticsEvents.PLAYBACK_RESUMED, {
      book_id: bookId,
      position: Math.floor(position),
    });
  }

  async trackChapterCompleted(bookId: string, chapterIndex: number) {
    await this.track(AnalyticsEvents.CHAPTER_COMPLETED, {
      book_id: bookId,
      chapter_index: chapterIndex,
    });
  }

  async trackBookCompleted(bookId: string, totalListenTimeSeconds: number) {
    await this.track(AnalyticsEvents.BOOK_COMPLETED, {
      book_id: bookId,
      total_listen_time: totalListenTimeSeconds,
    });
  }

  async trackPlaybackSpeedChanged(speed: number) {
    await this.track(AnalyticsEvents.PLAYBACK_SPEED_CHANGED, {
      speed,
    });
  }

  async trackSeek(direction: 'forward' | 'backward', seconds: number) {
    await this.track(AnalyticsEvents.SEEK, {
      direction,
      seconds,
    });
  }

  async trackDownloadStarted(bookId: string) {
    await this.track(AnalyticsEvents.DOWNLOAD_STARTED, {
      book_id: bookId,
    });
  }

  async trackDownloadCompleted(bookId: string, sizeMb?: number) {
    await this.track(AnalyticsEvents.DOWNLOAD_COMPLETED, {
      book_id: bookId,
      size_mb: sizeMb,
    });
  }

  async trackDownloadDeleted(bookId: string) {
    await this.track(AnalyticsEvents.DOWNLOAD_DELETED, {
      book_id: bookId,
    });
  }
}

// Export singleton instance
export const Analytics = new AnalyticsService();
