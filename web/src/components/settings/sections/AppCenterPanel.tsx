import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { AppId } from './AppHub';
import { CalendarSettings } from './CalendarSettings';
import { SpotifySettings } from './SpotifySettings';
import { FinanceSettings } from './FinanceSettings';
import { TodoAppSettings } from './TodoAppSettings';
import { HistoryAppSettings } from './HistoryAppSettings';
import { GmailSettings } from './GmailSettings';

const APP_LABELS: Record<AppId, string> = {
  calendar: 'Calendar',
  spotify: 'Spotify',
  finance: 'Finance',
  gmail: 'Gmail',
  todo: 'Tasks',
  history: 'History',
};

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function TodoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function GmailPanelIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#EA4335" strokeWidth="1.5"/>
      <polyline points="22,6 12,13 2,6" stroke="#EA4335" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="12 8 12 12 14 14" />
      <path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" />
    </svg>
  );
}

const APP_ICONS: Record<AppId, React.ReactNode> = {
  calendar: <CalendarIcon />,
  spotify: <SpotifyIcon />,
  finance: <FinanceIcon />,
  gmail: <GmailPanelIcon />,
  todo: <TodoIcon />,
  history: <HistoryIcon />,
};

interface AppCenterPanelProps {
  appId: AppId;
  onClose: () => void;
}

export function AppCenterPanel({ appId, onClose }: AppCenterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <div className="app-center-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className="app-center-panel glass-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${APP_LABELS[appId]} settings`}
        tabIndex={-1}
      >
        <div className="app-center-header">
          <div className="app-center-title">
            <span className="app-center-icon">{APP_ICONS[appId]}</span>
            <span className="app-center-name">{APP_LABELS[appId]}</span>
          </div>
          <button
            type="button"
            className="app-center-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="app-center-body">
          {appId === 'calendar' && <CalendarSettings />}
          {appId === 'spotify' && <SpotifySettings />}
          {appId === 'finance' && <FinanceSettings />}
          {appId === 'gmail' && <GmailSettings />}
          {appId === 'todo' && <TodoAppSettings />}
          {appId === 'history' && <HistoryAppSettings />}
        </div>
      </div>
    </>
  );
}
