import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useLinks } from '../../hooks/useLinks';
import { DockItem } from './DockItem';

export function DockBar() {
  const { links, addLink } = useLinks();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');

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

  if (!links.length) return null;

  return (
    <>
      <div className="dock-wrapper">
        <div className="dock-bar glass-dock">
          {links.map((link, i) => (
            <DockItem key={`${link.url}-${i}`} link={link} />
          ))}
          {links.length < 10 && (
            <button
              className="dock-item dock-add-btn"
              onClick={() => setShowForm(true)}
              title="Add link"
            >
              <Plus size={18} />
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="dock-form-backdrop" onClick={handleClose}>
          <form
            className="dock-form glass-panel"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
          >
            <button type="button" className="dock-form-close" onClick={handleClose}>
              <X size={16} />
            </button>
            <input
              className="dock-form-input glass-input"
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
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
    </>
  );
}
