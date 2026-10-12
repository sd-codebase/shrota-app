import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './AuthContext';
import { getFeatureFlags, type FeatureFlagKey } from '../services/featureFlagsApi';

/**
 * Which features an admin has switched on for the signed-in user. Everything
 * is off until the server says otherwise, and flags are re-read whenever the
 * app comes back to the foreground so admin changes apply without a restart.
 */

interface FeatureFlagsContextType {
  isEnabled: (key: FeatureFlagKey) => boolean;
  refresh: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [flags, setFlags] = useState<Partial<Record<FeatureFlagKey, boolean>>>({});

  const refresh = useCallback(async () => {
    if (!user) {
      setFlags({});
      return;
    }
    try {
      setFlags((await getFeatureFlags()).flags);
    } catch (error) {
      // Keep what we had: a network blip shouldn't flip features off and on.
      console.log('Could not fetch feature flags:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, [refresh]);

  const isEnabled = useCallback((key: FeatureFlagKey) => flags[key] === true, [flags]);

  return (
    <FeatureFlagsContext.Provider value={{ isEnabled, refresh }}>{children}</FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
}
