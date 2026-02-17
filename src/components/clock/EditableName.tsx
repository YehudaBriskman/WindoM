import { useRef, useCallback } from 'react';
import { useSettings } from '../../contexts/SettingsContext';

export function EditableName() {
  const { settings, update } = useSettings();
  const ref = useRef<HTMLSpanElement>(null);

  const handleBlur = useCallback(async () => {
    const newName = ref.current?.textContent?.trim();
    if (newName && newName !== settings.userName) {
      await update('userName', newName);
    } else if (!newName && ref.current) {
      ref.current.textContent = settings.userName;
    }
  }, [settings.userName, update]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      ref.current?.blur();
    }
  }, []);

  const handleFocus = useCallback(() => {
    if (!ref.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      className="editable-name"
    >
      {settings.userName}
    </span>
  );
}
