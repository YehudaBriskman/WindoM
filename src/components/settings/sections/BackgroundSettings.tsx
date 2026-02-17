import { useSettings } from '../../../contexts/SettingsContext';
import { localStorage as ls } from '../../../lib/chrome-storage';
import { showSettingsMessage } from '../SettingsMessage';

interface Props {
  formRef: React.MutableRefObject<Record<string, string | boolean>>;
}

export function BackgroundSettings({ formRef }: Props) {
  const { settings } = useSettings();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showSettingsMessage('Please select a valid image file', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showSettingsMessage('Image too large. Maximum size is 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await ls.set('localBackgroundImage', ev.target?.result);
      showSettingsMessage('Background image uploaded successfully', 'success');
      formRef.current.backgroundSource = 'local';
    };
    reader.onerror = () => showSettingsMessage('Error reading image file', 'error');
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Background Source:</label>
        <select
          defaultValue={settings.backgroundSource}
          onChange={(e) => (formRef.current.backgroundSource = e.target.value)}
          className="settings-select glass-input"
        >
          <option value="unsplash">Unsplash</option>
          <option value="local">Local Image</option>
        </select>
      </div>
      <div className="settings-group">
        <label className="settings-label">Unsplash API Key (optional):</label>
        <input
          type="text"
          defaultValue={settings.unsplashApiKey}
          placeholder="Your API key"
          onChange={(e) => (formRef.current.unsplashApiKey = e.target.value)}
          className="settings-input glass-input"
        />
        <small className="settings-hint">
          Get your key at{' '}
          <a href="https://unsplash.com/developers" target="_blank" rel="noopener noreferrer">
            unsplash.com/developers
          </a>
        </small>
      </div>
      <div className="settings-group">
        <label className="settings-label">Unsplash Collection ID (optional):</label>
        <input
          type="text"
          defaultValue={settings.unsplashCollectionId}
          placeholder="Collection ID"
          onChange={(e) => (formRef.current.unsplashCollectionId = e.target.value)}
          className="settings-input glass-input"
        />
        <small className="settings-hint">Leave empty for random nature photos</small>
      </div>
      <div className="settings-group">
        <label className="settings-label">Upload Local Background:</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="settings-file-input glass-input"
        />
      </div>
    </div>
  );
}
