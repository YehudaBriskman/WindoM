import { useState, useEffect, useRef, useCallback, useId } from 'react';
import { Plus, X } from 'lucide-react';
import { useLinks } from '../../hooks/useLinks';
import { useSettings } from '../../contexts/SettingsContext';
import { DockItem } from './DockItem';
import { isValidUrl } from '../../utils/url';
import { useLiquidGlass } from '../../hooks/useLiquidGlass';
import '../ui/feedback.css';

const ITEMS_PER_ROW = 9;
const ROW_HEIGHT = 44;
const MAX_ROWS = 3;
const MAX_LINKS = MAX_ROWS * ITEMS_PER_ROW;

// Smooth scrolling is motion: honour prefers-reduced-motion (WCAG 2.3.3).
function scrollBehavior(): ScrollBehavior {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
}

export function DockBar() {
  const glassRef = useLiquidGlass<HTMLDivElement>('dock');
  const { settings } = useSettings();
  const { links, addLink, removeLink } = useLinks();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [activeRow, setActiveRow] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const formWasOpen = useRef(false);
  const rowsRef = useRef<HTMLDivElement>(null);
  const nameId = useId();
  const urlId = useId();
  const urlErrorId = useId();

  // Chunk links into rows of ITEMS_PER_ROW
  const rows: (typeof links)[] = [];
  for (let i = 0; i < links.length; i += ITEMS_PER_ROW) {
    rows.push(links.slice(i, i + ITEMS_PER_ROW));
  }

  const scrollToRow = useCallback((index: number) => {
    rowsRef.current?.scrollTo({ top: index * ROW_HEIGHT, behavior: scrollBehavior() });
  }, []);

  // Track which row is visible based on scroll position
  useEffect(() => {
    const el = rowsRef.current;
    if (!el) return;
    const onScroll = () => {
      setActiveRow(Math.round(el.scrollTop / ROW_HEIGHT));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Intercept wheel events to move exactly one row at a time
  useEffect(() => {
    const el = rowsRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      setActiveRow((prev) => {
        const next = Math.max(0, Math.min(rows.length - 1, prev + direction));
        rowsRef.current?.scrollTo({ top: next * ROW_HEIGHT, behavior: scrollBehavior() });
        return next;
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [rows.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedName = name.trim();
    if (!trimmedUrl) return;
    const destination = /^[a-z][a-z0-9+.-]*:/i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;
    if (!isValidUrl(destination)) {
      setUrlError('Enter a valid HTTP or HTTPS URL.');
      return;
    }
    addLink({
      name: trimmedName || new URL(destination).hostname.replace(/^www\./, ''),
      url: destination,
      icon: '',
    });
    setName('');
    setUrl('');
    setUrlError('');
    setShowForm(false);
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setUrlError('');
    setShowForm(false);
  };

  useEffect(() => {
    if (showForm) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    } else if (formWasOpen.current) {
      // Closing (Add, Cancel, Escape) must not strand keyboard focus on <body>.
      const active = document.activeElement;
      if (!active || active === document.body) addButtonRef.current?.focus();
    }
    formWasOpen.current = showForm;
  }, [showForm]);

  useEffect(() => {
    if (!showForm) return;
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose();
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showForm]);

  if (!settings.widgets.showLinks) return null;

  return (
    <div className="dock-wrapper">
      <div ref={glassRef} className="dock-bar glass-dock">
        {links.length === 0 && (
          // Empty state: keep the dock (and its add button below) visible
          // instead of vanishing, which left no way to add a first link here.
          <p className="dock-empty">No links yet. Use + below to add one.</p>
        )}
        <div className="dock-rows" ref={rowsRef} hidden={links.length === 0}>
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="dock-row">
              {row.map((link, i) => (
                <DockItem
                  key={`${link.url}-${rowIndex * ITEMS_PER_ROW + i}`}
                  link={link}
                  onRemove={() => removeLink(rowIndex * ITEMS_PER_ROW + i)}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Row indicator - only shown when there are multiple rows */}
      {rows.length > 1 && (
        <div className="dock-page-indicator">
          {rows.map((_, i) => (
            <button
              key={i}
              className={`dock-page-dot${i === activeRow ? ' active' : ''}`}
              onClick={() => scrollToRow(i)}
              aria-label={`Go to row ${i + 1}`}
            />
          ))}
        </div>
      )}

      {links.length < MAX_LINKS && (
        <div
          ref={containerRef}
          className={`dock-expandable${showForm ? ' expanded glass-panel' : ''}`}
          onKeyDown={(e) => {
            if (showForm && e.key === 'Escape') {
              e.stopPropagation();
              handleClose();
              addButtonRef.current?.focus();
            }
          }}
        >
          <button
            ref={addButtonRef}
            type="button"
            className="dock-expand-icon"
            aria-label="Add link"
            aria-expanded={showForm}
            inert={showForm}
            onClick={(e) => {
              e.stopPropagation();
              setShowForm(true);
            }}
          >
            <Plus size={18} aria-hidden="true" />
          </button>

          <form
            className="dock-expand-form"
            inert={!showForm}
            aria-label="Add a link"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <button type="button" className="dock-form-close" onClick={handleClose} aria-label="Cancel adding a link">
              <X size={16} />
            </button>
            <label htmlFor={nameId} className="sr-only">
              Link name
            </label>
            <input
              ref={nameInputRef}
              id={nameId}
              className="dock-form-input glass-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor={urlId} className="sr-only">
              Link URL
            </label>
            <input
              id={urlId}
              className="dock-form-input glass-input"
              type="text"
              placeholder="https://..."
              aria-invalid={!!urlError}
              aria-describedby={urlError ? urlErrorId : undefined}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError('');
              }}
            />
            {urlError && (
              <p id={urlErrorId} role="alert" className="auth-field-error">
                {urlError}
              </p>
            )}
            <button type="submit" className="dock-form-submit">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
