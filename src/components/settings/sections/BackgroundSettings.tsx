import { useSettings } from '../../../contexts/SettingsContext';
import { useBackgroundContext } from '../../../contexts/BackgroundContext';
import { localStorage as ls } from '../../../lib/chrome-storage';
import { showSettingsMessage } from '../SettingsMessage';

export function BackgroundSettings() {
  const { settings, update } = useSettings();
  const { addLocalPhoto } = useBackgroundContext();

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
      const dataUrl = ev.target?.result as string;
      await ls.set('localBackgroundImage', dataUrl);

      // Generate thumbnail via canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const scale = Math.max(200 / img.width, 120 / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          ctx.drawImage(img, (200 - w) / 2, (120 - h) / 2, w, h);
          const thumbDataUrl = canvas.toDataURL('image/jpeg', 0.75);
          addLocalPhoto(dataUrl, thumbDataUrl, file.name);
        }
      };
      img.src = dataUrl;

      await update('backgroundSource', 'local');
      showSettingsMessage('Background image uploaded successfully', 'success');
    };
    reader.onerror = () => showSettingsMessage('Error reading image file', 'error');
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div className="settings-group">
        <label className="settings-label">Background Source:</label>
        <select
          value={settings.backgroundSource}
          onChange={(e) => update('backgroundSource', e.target.value as 'unsplash' | 'local')}
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
          onChange={(e) => update('unsplashApiKey', e.target.value)}
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
          onChange={(e) => update('unsplashCollectionId', e.target.value)}
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
