import { useCallback } from 'react';
import { useSettings } from '../contexts/SettingsContext';

export function useFocus() {
  const { settings, update } = useSettings();
  const { mainFocus, completed } = settings.focus;

  const setText = useCallback(
    async (value: string): Promise<boolean> => {
      // Resolves false when either write failed, so a caller can say so.
      const saved = await update('focus', { mainFocus: value });
      if (value !== mainFocus) {
        return (await update('focus', { completed: false })) && saved;
      }
      return saved;
    },
    [mainFocus, update],
  );

  const toggleCompleted = useCallback(async (): Promise<boolean> => {
    if (!mainFocus.trim()) return true;
    return update('focus', { completed: !completed });
  }, [mainFocus, completed, update]);

  return {
    text: mainFocus,
    completed,
    setText,
    toggleCompleted,
  };
}
