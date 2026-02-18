const TABS = ['general', 'background', 'weather', 'quotes', 'links', 'photos'] as const;
export type SettingsTab = typeof TABS[number];

const LABELS: Record<SettingsTab, string> = {
  general: 'General',
  background: 'Background',
  weather: 'Weather',
  quotes: 'Quotes',
  links: 'Links',
  photos: 'Photos',
};

interface SettingsNavProps {
  active: SettingsTab;
  onChange: (tab: SettingsTab) => void;
}

export function SettingsNav({ active, onChange }: SettingsNavProps) {
  return (
    <div className="settings-nav">
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`settings-nav-btn ${active === tab ? 'active' : ''}`}
        >
          {LABELS[tab]}
        </button>
      ))}
    </div>
  );
}
