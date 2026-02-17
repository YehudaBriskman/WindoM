import { Settings } from 'lucide-react';

export function SettingsButton() {
  return (
    <div
      className="settings-btn glass-panel"
      onClick={() => document.dispatchEvent(new CustomEvent('toggle-settings'))}
    >
      <Settings size={20} />
    </div>
  );
}
