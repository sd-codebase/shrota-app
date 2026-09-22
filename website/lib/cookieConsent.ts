// Cookie consent state — read/write helpers shared by the CookieConsent
// banner and anything else that needs to check consent (e.g. before loading
// an analytics script in the future).

const STORAGE_KEY = "shrota_cookie_consent";
const CONSENT_VERSION = 1;

export interface CookieConsent {
  necessary: true; // always on — required for the site to function
  analytics: boolean;
  preferences: boolean;
}

export interface StoredCookieConsent extends CookieConsent {
  version: number;
  decidedAt: string;
}

export const DEFAULT_CONSENT: CookieConsent = {
  necessary: true,
  analytics: false,
  preferences: false,
};

export function getStoredConsent(): StoredCookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredCookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null; // re-ask if categories changed
    return parsed;
  } catch {
    return null;
  }
}

export function saveConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;
  const stored: StoredCookieConsent = {
    ...consent,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // localStorage unavailable (private mode, blocked, etc.) — nothing to do
  }
}

// Convenience check for gating optional scripts/features elsewhere in the app.
export function hasConsent(category: keyof CookieConsent): boolean {
  const stored = getStoredConsent();
  if (!stored) return false;
  return stored[category] === true;
}
