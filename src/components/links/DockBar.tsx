import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { useLinks } from '../../hooks/useLinks';
import { useSettings } from '../../contexts/SettingsContext';
import { DockItem } from './DockItem';

export function DockBar() {
  const { settings } = useSettings();
  const { links, addLink } = useLinks();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

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
    if (showForm) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
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
        {links.map((link, i) => (
          <DockItem key={`${link.url}-${i}`} link={link} />
        ))}
      </div>

      {links.length < 10 && (
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
