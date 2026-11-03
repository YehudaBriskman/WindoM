import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocus } from '../../hooks/useFocus';
import { useSettings } from '../../contexts/SettingsContext';
import { useSaveStatus } from '../../hooks/useSaveStatus';
import { SaveStatus } from '../ui/SaveStatus';

export function FocusInput() {
  const { settings } = useSettings();
  const { text, completed, setText, toggleCompleted } = useFocus();
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);
  const { state: saveState, track } = useSaveStatus();

  // Sync from settings (cross-tab)
  useEffect(() => {
    setLocalValue(text);
  }, [text]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleBlur = useCallback(() => {
    const trimmed = localValue.trim();
    if (trimmed !== text) void track(() => setText(trimmed));
    setEditing(false);
  }, [localValue, text, setText, track]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  }, []);

  const startEditing = useCallback(() => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  if (!settings.widgets.showFocus) return null;

  // One container for both modes, with the save status as a stable last
  // child, so the live region survives the switch from input to display.
  const showInput = !text || editing;

  return (
    <div className="focus-container">
      {showInput ? (
        // No text yet or actively editing: show input
        <>
          {!text && <label className="focus-label text-shadow-sm">What is your main focus for today?</label>}
          <input
            ref={inputRef}
            type="text"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Your main focus..."
            className="focus-input"
          />
        </>
      ) : (
        // Has text: show as clickable display (click toggles completion, double-click to edit)
        <button
          type="button"
          onClick={toggleCompleted}
          onDoubleClick={startEditing}
          className="focus-display"
          style={{
            textDecoration: completed ? 'line-through' : 'none',
            opacity: completed ? 0.6 : 1,
          }}
          title="Click to toggle completion, double-click to edit"
          aria-pressed={completed}
        >
          {text}
        </button>
      )}
      <div className="focus-save-status text-shadow-sm">
        <SaveStatus state={saveState} />
      </div>
    </div>
  );
}
