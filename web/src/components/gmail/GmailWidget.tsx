import { useGmail } from '../../hooks/useGmail';
import { useSettings } from '../../contexts/SettingsContext';

function GmailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#EA4335" strokeWidth="1.5"/>
      <polyline points="22,6 12,13 2,6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function formatFrom(from: string): string {
  const match = from.match(/^"?([^"<]+)"?\s*</);
  return match ? match[1].trim() : from.split('@')[0];
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function GmailWidget() {
  const { settings } = useSettings();
  const { summary, loading, error } = useGmail();

  if (!settings.integrations.gmail.connected || !settings.integrations.gmail.show) return null;

  return (
    <div className="gmail-widget">
      <div className="gmail-widget-header">
        <GmailIcon />
        <span className="gmail-widget-title">Gmail</span>
        {summary && summary.unreadCount > 0 && (
          <span className="gmail-unread-badge">{summary.unreadCount > 99 ? '99+' : summary.unreadCount}</span>
        )}
      </div>

      {loading && !summary && (
        <div className="gmail-widget-empty">Loading…</div>
      )}

      {error && (
        <div className="gmail-widget-error">{error}</div>
      )}

      {summary && summary.messages.length === 0 && !error && (
        <div className="gmail-widget-empty">No unread messages</div>
      )}

      {summary && summary.messages.length > 0 && (
        <div className="gmail-message-list">
          {summary.messages.map((msg) => (
            <div key={msg.id} className="gmail-message-row">
              <div className="gmail-message-meta">
                <span className="gmail-message-from">{formatFrom(msg.from)}</span>
                <span className="gmail-message-date">{formatDate(msg.date)}</span>
              </div>
              <div className="gmail-message-subject">{msg.subject}</div>
              {msg.snippet && (
                <div className="gmail-message-snippet">{msg.snippet}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
