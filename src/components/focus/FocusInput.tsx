import { useState, useCallback, useEffect, useRef } from 'react';
import { useFocus } from '../../hooks/useFocus';

export function FocusInput() {
  const { text, completed, setText, toggleCompleted } = useFocus();
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(text);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync from settings (cross-tab)
  useEffect(() => {
    setLocalValue(text);
  }, [text]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLocalValue(e.target.value);
    },
    [],
  );

  const handleBlur = useCallback(() => {
    const trimmed = localValue.trim();
    if (trimmed !== text) setText(trimmed);
    setEditing(false);
  }, [localValue, text, setText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
    },
    [],
  );

  const startEditing = useCallback(() => {
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  // No text yet or actively editing: show input
  if (!text || editing) {
    return (
      <div className="focus-container">
        {!text && (
          <label className="focus-label text-shadow-sm">
            What is your main focus for today?
          </label>
        )}
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
      </div>
    );
  }

  // Has text: show as clickable display (click toggles completion, double-click to edit)
  return (
    <div className="focus-container">
      <div
        onClick={toggleCompleted}
        onDoubleClick={startEditing}
        className="focus-display"
        style={{
          textDecoration: completed ? 'line-through' : 'none',
          opacity: completed ? 0.6 : 1,
        }}
        title="Click to toggle completion, double-click to edit"
      >
        {text}
      </div>
    </div>
  );
}
