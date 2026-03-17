import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus, X } from 'lucide-react';
import { useLinks } from '../../hooks/useLinks';
import { useSettings } from '../../contexts/SettingsContext';
import { DockItem } from './DockItem';

const ITEMS_PER_ROW = 9;
const ROW_HEIGHT = 44;
const MAX_LINKS = 27;

export function DockBar() {
  const { settings } = useSettings();
  const { links, addLink, removeLink } = useLinks();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [activeRow, setActiveRow] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const rowsRef = useRef<HTMLDivElement>(null);

  // Chunk links into rows of ITEMS_PER_ROW
  const rows: typeof links[] = [];
  for (let i = 0; i < links.length; i += ITEMS_PER_ROW) {
    rows.push(links.slice(i, i + ITEMS_PER_ROW));
  }

  const scrollToRow = useCallback((index: number) => {
    rowsRef.current?.scrollTo({ top: index * ROW_HEIGHT, behavior: 'smooth' });
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedName = name.trim();
    if (!trimmedUrl) return;
    addLink({
      name: trimmedName || new URL(trimmedUrl).hostname.replace('www.', ''),
      url: trimmedUrl.startsWith('http') ? trimmedUrl : `https://${trimmedUrl}`,
      icon: '',
    });
    setName('');
    setUrl('');
    setShowForm(false);
  };

  const handleClose = () => {
    setName('');
    setUrl('');
    setShowForm(false);
  };

  useEffect(() => {
    if (showForm) setTimeout(() => nameInputRef.current?.focus(), 50);
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

  if (!settings.showLinks) return null;
  if (!links.length) return null;

  return (
    <div className="dock-wrapper">
      <div className="dock-bar glass-dock">
        <div className="dock-rows" ref={rowsRef}>
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

      {/* Row indicator — only shown when there are multiple rows */}
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
          onClick={!showForm ? (e) => { e.stopPropagation(); setShowForm(true); } : undefined}
        >
          <div className="dock-expand-icon">
            <Plus size={18} />
          </div>

          <form
            className="dock-expand-form"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <button type="button" className="dock-form-close" onClick={handleClose}>
              <X size={16} />
            </button>
            <input
              ref={nameInputRef}
              className="dock-form-input glass-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="dock-form-input glass-input"
              type="text"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button type="submit" className="dock-form-submit">
              Add
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
