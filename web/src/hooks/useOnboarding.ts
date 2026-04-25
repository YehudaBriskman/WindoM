import { useState, useEffect, useCallback } from 'react';
import { localStore } from '../lib/chrome-storage';

const ONBOARDING_KEY = 'windom_onboarding';

interface OnboardingState {
  completed: boolean;
  spotifyNoticeDismissed: boolean;
}

interface UseOnboardingReturn {
  showOnboarding: boolean;
  showSpotifyNotice: boolean;
  completeOnboarding: () => Promise<void>;
  dismissSpotifyNotice: () => Promise<void>;
}

export function useOnboarding(): UseOnboardingReturn {
  const [state, setState] = useState<OnboardingState | null>(null);

  useEffect(() => {
    async function init(): Promise<void> {
      const stored = await localStore.get<OnboardingState | null>(ONBOARDING_KEY, null);

      if (stored !== null) {
        setState(stored);
        return;
      }

      // First time this key exists - detect new vs existing user by whether
      // they already have synced settings from a previous session.
      const syncData = await chrome.storage.sync.get(null);
      const isExistingUser = Object.keys(syncData).length > 0;

      const initial: OnboardingState = {
        completed: isExistingUser,
        // New users get onboarding instead of the notice; existing users get notice.
        spotifyNoticeDismissed: !isExistingUser,
      };

      await localStore.set(ONBOARDING_KEY, initial);
      setState(initial);
    }

    void init();
  }, []);

  const completeOnboarding = useCallback(async (): Promise<void> => {
    const next: OnboardingState = { completed: true, spotifyNoticeDismissed: true };
    await localStore.set(ONBOARDING_KEY, next);
    setState(next);
  }, []);

  const dismissSpotifyNotice = useCallback(async (): Promise<void> => {
    const next: OnboardingState = { ...(state ?? { completed: true, spotifyNoticeDismissed: false }), spotifyNoticeDismissed: true };
    await localStore.set(ONBOARDING_KEY, next);
    setState(next);
  }, [state]);

  return {
    showOnboarding: state !== null && !state.completed,
    showSpotifyNotice: state !== null && state.completed && !state.spotifyNoticeDismissed,
    completeOnboarding,
    dismissSpotifyNotice,
  };
}
