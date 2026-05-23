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
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);
  const listboxId = useId();

  const selected = options.find((o) => o.value === value);
  const selectedIndex = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const openAt = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const closeAndFocusTrigger = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectOption = (option: Option) => {
    onChange(option.value);
    closeAndFocusTrigger();
  };

  const moveActiveOption = (nextIndex: number) => {
    setActiveIndex((nextIndex + options.length) % options.length);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    optionRefs.current[activeIndex]?.focus();
  }, [activeIndex, open]);

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (options.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        openAt(open ? activeIndex + 1 : selectedIndex);
        break;
      case 'ArrowUp':
        e.preventDefault();
        openAt(open ? activeIndex - 1 : selectedIndex);
        break;
      case 'Home':
        e.preventDefault();
        openAt(0);
        break;
      case 'End':
        e.preventDefault();
        openAt(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        openAt(selectedIndex);
        break;
      case 'Escape':
        if (open) {
          e.preventDefault();
          closeAndFocusTrigger();
        }
        break;
    }
  };

  const handleOptionKeyDown = (e: KeyboardEvent<HTMLLIElement>, opt: Option) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        moveActiveOption(activeIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        moveActiveOption(activeIndex - 1);
        break;
      case 'Home':
        e.preventDefault();
        setActiveIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        selectOption(opt);
        break;
      case 'Escape':
        e.preventDefault();
        closeAndFocusTrigger();
        break;
    }
  };

  return (
    <div ref={ref} className={`glass-select-wrapper ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        className="glass-select-trigger"
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((isOpen) => !isOpen);
        }}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
      >
        <span>{selected?.label ?? value}</span>
        <ChevronDown size={15} className={`glass-select-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <ul id={listboxId} className="glass-select-dropdown" role="listbox">
          {options.map((opt, index) => (
            <li
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              key={opt.value}
              role="option"
              aria-selected={opt.value === value}
              tabIndex={index === activeIndex ? 0 : -1}
              className={`glass-select-option ${opt.value === value ? 'active' : ''}`}
              onKeyDown={(e) => handleOptionKeyDown(e, opt)}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                selectOption(opt);
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
