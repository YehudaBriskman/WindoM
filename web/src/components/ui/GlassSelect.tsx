import { useState, useRef, useEffect, useId, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface GlassSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

export function GlassSelect({ value, onChange, options, className = '' }: GlassSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();

  const selected = options.find((o) => o.value === value);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const listboxId = `${id}-glass-select-listbox`;
  const activeOptionId = options[activeIndex] ? `${listboxId}-option-${activeIndex}` : undefined;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex);
  }, [open, selectedIndex]);

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectOption = (index: number) => {
    const option = options[index];
    if (!option) return;

    onChange(option.value);
    closeAndFocusTrigger();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(selectedIndex);
          return;
        }
        setActiveIndex((index) => Math.min(index + 1, options.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(selectedIndex);
          return;
        }
        setActiveIndex((index) => Math.max(index - 1, 0));
        break;
      case 'Home':
        e.preventDefault();
        if (!open) setOpen(true);
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        if (!open) setOpen(true);
        setActiveIndex(Math.max(options.length - 1, 0));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setActiveIndex(selectedIndex);
          return;
        }
        selectOption(activeIndex);
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          closeAndFocusTrigger();
        }
        break;
    }
  };

  return (
    <div ref={ref} className={`glass-select-wrapper ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="glass-select-trigger"
        onClick={() => setOpen((o) => !o)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-activedescendant={open ? activeOptionId : undefined}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={15} className={`glass-select-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <ul id={listboxId} className="glass-select-dropdown" role="listbox">
          {options.map((opt, index) => (
            <li
              id={`${listboxId}-option-${index}`}
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              className={`glass-select-option ${opt.value === value ? 'active' : ''} ${
                index === activeIndex ? 'keyboard-active' : ''
              }`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
