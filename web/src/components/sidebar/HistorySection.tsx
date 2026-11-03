import { Clock } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { useHistory, relativeTime } from '../../hooks/useHistory';

const FAVICON = (hostname: string) => `https://www.google.com/s2/favicons?sz=16&domain=${hostname}`;

export function HistorySection() {
  const { settings } = useSettings();
  const { items, granted, request } = useHistory(settings.general.showHistory);

  if (!settings.general.showHistory || granted === null) return null;

  // The setting is on but Chrome has no `history` permission for this
  // install: it was revoked, or the setting synced from another device.
  // Offer the grant here rather than silently showing nothing.
  if (granted === false) {
    return (
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <Clock size={14} strokeWidth={1.8} />
          <span>Recent</span>
        </div>
        <div className="calendar-empty">
          <p style={{ margin: '0 0 10px' }}>Recent sites need access to your browsing history.</p>
          <button type="button" className="integration-connect-btn" onClick={() => void request()}>
            Allow access
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="sidebar-section">
      <div className="sidebar-section-header">
        <Clock size={14} strokeWidth={1.8} />
        <span>Recent</span>
      </div>
      <div className="history-list">
        {items.map((item) => (
          <a key={item.url} href={item.url} target="_blank" rel="noopener noreferrer" className="history-item">
            <img
              src={FAVICON(item.hostname)}
              alt=""
              className="history-favicon"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
            <span className="history-title">{item.title}</span>
            <span className="history-time">{relativeTime(item.lastVisitTime)}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
