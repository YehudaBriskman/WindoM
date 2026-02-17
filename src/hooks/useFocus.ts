import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export function useFocus() {
  const { settings, update } = useSettings();

  const setText = useCallback(
    async (value: string) => {
      await update('mainFocus', value);
      // Reset completion when text changes
      if (value !== settings.mainFocus) {
        await update('focusCompleted', false);
      }
    },
    [settings.mainFocus, update],
  );

  const toggleCompleted = useCallback(async () => {
    if (!settings.mainFocus.trim()) return;
    await update('focusCompleted', !settings.focusCompleted);
  }, [settings.mainFocus, settings.focusCompleted, update]);

  return {
    text: settings.mainFocus,
    completed: settings.focusCompleted,
    setText,
    toggleCompleted,
  };
}
