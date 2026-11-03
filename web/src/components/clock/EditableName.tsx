import { useRef, useCallback } from 'react';
import { useSettings } from '../../contexts/SettingsContext';
import { useSaveStatus } from '../../hooks/useSaveStatus';
import { SaveStatus } from '../ui/SaveStatus';

export function EditableName() {
  const { settings, update } = useSettings();
  const ref = useRef<HTMLSpanElement>(null);
  const saving = useRef(false);
  const { state, track } = useSaveStatus();

  const handleBlur = useCallback(async () => {
    const newName = ref.current?.textContent?.trim();
    if (newName && newName !== settings.general.userName) {
      // One save at a time: a second blur while the first is in flight would
      // race it to storage.
      if (saving.current) return;
      saving.current = true;
      const ok = await track(() => update('general', { userName: newName }));
      saving.current = false;
      // On failure, show the name that is actually stored, not the one typed.
      if (!ok && ref.current) ref.current.textContent = settings.general.userName;
    } else if (!newName && ref.current) {
      ref.current.textContent = settings.general.userName;
    }
  }, [settings.general.userName, update, track]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ref.current?.blur();
      } else if (e.key === 'Escape') {
        // Cancel: restore the saved name, then blur (handleBlur sees no change).
        e.preventDefault();
        if (ref.current) ref.current.textContent = settings.general.userName;
        ref.current?.blur();
      }
    },
    [settings.general.userName],
  );

  const handleFocus = useCallback(() => {
    if (!ref.current) return;
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(ref.current);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  return (
    <span className="save-status-anchor">
      <span
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Your name"
        aria-multiline="false"
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        className="editable-name"
      >
        {settings.general.userName}
      </span>
      <SaveStatus state={state} />
    </span>
  );
}
