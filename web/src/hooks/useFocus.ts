import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export function useFocus() {
  const { settings, update } = useSettings();
  const { mainFocus, completed } = settings.focus;

  const setText = useCallback(
    async (value: string) => {
      await update('focus', { mainFocus: value });
      if (value !== mainFocus) {
        await update('focus', { completed: false });
      }
    },
    [mainFocus, update],
  );

  const toggleCompleted = useCallback(async () => {
    if (!mainFocus.trim()) return;
    await update('focus', { completed: !completed });
  }, [mainFocus, completed, update]);

  return {
    text: mainFocus,
    completed,
    setText,
    toggleCompleted,
  };
}
