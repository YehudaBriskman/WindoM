import { useAuth } from '../../contexts/AuthContext';

const TABS = ['general', 'clock', 'background', 'weather', 'quotes', 'links', 'calendar', 'spotify', 'account'] as const;
export type SettingsTab = typeof TABS[number];

const LABELS: Record<SettingsTab, string> = {
  general: 'General',
  clock: 'Clock',
  background: 'Background',
  weather: 'Weather',
  quotes: 'Quotes',
  links: 'Links',
  calendar: 'Calendar',
  spotify: 'Spotify',
  account: 'Account',
};

/** Tabs that require a signed-in user to be interactive */
const AUTH_REQUIRED_TABS = new Set<SettingsTab>(['calendar']);

interface SettingsNavProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  const { user } = useAuth();

  return (
    <div className="settings-nav">
      {TABS.map((tab) => {
        const locked = AUTH_REQUIRED_TABS.has(tab) && !user;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            disabled={locked}
            title={locked ? 'Sign in to access' : undefined}
            className={`settings-nav-btn ${active === tab ? 'active' : ''} ${locked ? 'locked' : ''}`}
          >
            {LABELS[tab]}
            {locked && <span className="settings-nav-lock">🔒</span>}
          </button>
        );
      })}
    </div>
  );
}
