import { Music, X } from 'lucide-react';
import { SETTINGS_EVENT } from '../../lib/settings-events';

interface Props {
  onDismiss: () => Promise<void>;
}

export function SpotifyNotice({ onDismiss }: Props): React.ReactElement {
  function openAccount(): void {
    document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.OPEN_ACCOUNT));
    void onDismiss();
  }

  return (
    <div className="spotify-notice" role="status">
      <div className="spotify-notice-icon">
        <Music size={18} />
      </div>
      <div className="spotify-notice-content">
        <span className="spotify-notice-title">Spotify is now available</span>
        <span className="spotify-notice-sub">See what&apos;s playing right in your new tab.</span>
      </div>
      <button className="spotify-notice-connect" onClick={openAccount}>
        Connect
      </button>
      <button className="spotify-notice-dismiss" onClick={() => void onDismiss()} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  );
}
