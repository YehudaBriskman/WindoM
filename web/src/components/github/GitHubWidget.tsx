import { useGitHub } from '../../hooks/useGitHub';
import { useSettings } from '../../contexts/SettingsContext';

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function PRIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M13 6h3a2 2 0 0 1 2 2v7" />
      <line x1="6" y1="9" x2="6" y2="21" />
    </svg>
  );
}

function IssueIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

export function GitHubWidget() {
  const { settings } = useSettings();
  const { summary, loading, error } = useGitHub();

  if (!settings.integrations.github.connected || !settings.integrations.github.show) return null;

  const rows = summary ? [
    {
      icon: <BellIcon />,
      label: 'Notifications',
      count: summary.notificationCount,
      href: 'https://github.com/notifications',
    },
    {
      icon: <PRIcon />,
      label: 'Review Requests',
      count: summary.reviewRequested,
      href: 'https://github.com/pulls/review-requested',
    },
    {
      icon: <IssueIcon />,
      label: 'Assigned Issues',
      count: summary.assignedIssues,
      href: 'https://github.com/issues/assigned',
    },
  ] : [];

  return (
    <div className="github-widget">
      <div className="github-widget-header">
        <GitHubIcon />
        <span className="github-widget-title">GitHub</span>
        {summary && summary.notificationCount > 0 && (
          <span className="github-badge">{summary.notificationCount > 99 ? '99+' : summary.notificationCount}</span>
        )}
      </div>

      {loading && !summary && (
        <div className="github-widget-empty">Loading…</div>
      )}

      {error && (
        <div className="github-widget-error">{error}</div>
      )}

      {summary && (
        <div className="github-stat-list">
          {rows.map((row) => (
            <a
              key={row.label}
              href={row.href}
              target="_blank"
              rel="noreferrer"
              className="github-stat-row"
            >
              <span className="github-stat-icon">{row.icon}</span>
              <span className="github-stat-label">{row.label}</span>
              <span className="github-stat-count">{row.count}</span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
