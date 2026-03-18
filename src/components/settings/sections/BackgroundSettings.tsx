import { Upload } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useBackgroundContext } from '../../../contexts/BackgroundContext';
import { localStore as ls } from '../../../lib/chrome-storage';
import { showSettingsMessage } from '../SettingsMessage';
import { GlassSelect } from '../../ui/GlassSelect';
import { PhotoGrid } from '../PhotoGrid';
import { BUNDLED_PHOTOS } from '../../../lib/bundled-photos';

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function BackgroundSettings() {
  const { settings, update } = useSettings();
  const { addLocalPhoto, setFromPhoto, photoHistory } = useBackgroundContext();
  const { unsplashHistory, localHistory, liked, toggleLike, deleteLocalPhoto } = photoHistory;

  const unsplashLiked = liked.filter((p) => p.source === 'unsplash' || !p.source);
  const localLiked = liked.filter((p) => p.source === 'local');

  const isUnsplash = settings.backgroundSource === 'unsplash';

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showSettingsMessage('Please select a valid image file', 'error');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      showSettingsMessage(`Image too large. Maximum size is ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB`, 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      await ls.set('localBackgroundImage', dataUrl);

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
      {/* Source selector */}
      <div className="settings-group">
        <label className="settings-label">Background Source:</label>
        <GlassSelect
          value={settings.backgroundSource}
          onChange={(value) => update('backgroundSource', value as 'unsplash' | 'local')}
          options={[
            { value: 'unsplash', label: 'Unsplash' },
            { value: 'local', label: 'Local Image' },
          ]}
        />
      </div>

      {/* Unsplash settings */}
      {isUnsplash && (
        <>
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

          <section style={{ marginTop: 24 }}>
            <h3 className="settings-section-heading">Unsplash Photos</h3>
            {unsplashLiked.length > 0 && (
              <div className="settings-group">
                <label className="settings-label" style={{ fontSize: 13, opacity: 0.7 }}>Liked</label>
                <PhotoGrid photos={unsplashLiked} onLike={toggleLike} onSelect={setFromPhoto} />
              </div>
            )}
            <div className="settings-group">
              <label className="settings-label" style={{ fontSize: 13, opacity: 0.7 }}>Recent</label>
              <PhotoGrid photos={unsplashHistory} onLike={toggleLike} onSelect={setFromPhoto} />
            </div>
          </section>
        </>
      )}

      {/* Local settings */}
      {!isUnsplash && (
        <>
          <div className="settings-group">
            <div className="upload-row">
              <span className="settings-label" style={{ margin: 0 }}>Upload local background</span>
              <label className="upload-circle-btn" title="Choose image">
                <Upload size={15} />
                <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>

          <section style={{ marginTop: 24, marginBottom: 28 }}>
            <h3 className="settings-section-heading">Built-in</h3>
            <div className="settings-group">
              <PhotoGrid photos={BUNDLED_PHOTOS} onLike={() => {}} onSelect={setFromPhoto} />
            </div>
          </section>

          <section>
            <h3 className="settings-section-heading">Local Photos</h3>
            {localLiked.length > 0 && (
              <div className="settings-group">
                <label className="settings-label" style={{ fontSize: 13, opacity: 0.7 }}>Liked</label>
                <PhotoGrid photos={localLiked} onLike={toggleLike} onSelect={setFromPhoto} onDelete={deleteLocalPhoto} />
              </div>
            )}
            <div className="settings-group">
              <label className="settings-label" style={{ fontSize: 13, opacity: 0.7 }}>Recent (up to 5)</label>
              <PhotoGrid photos={localHistory} onLike={toggleLike} onSelect={setFromPhoto} onDelete={deleteLocalPhoto} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
