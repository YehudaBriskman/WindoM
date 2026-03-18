import { Heart, Upload, Trash2 } from 'lucide-react';
import { useSettings } from '../../../contexts/SettingsContext';
import { useBackgroundContext } from '../../../contexts/BackgroundContext';
import { localStorage as ls } from '../../../lib/chrome-storage';
import { showSettingsMessage } from '../SettingsMessage';
import { GlassSelect } from '../../ui/GlassSelect';
import type { PhotoRecord } from '../../../types/photos';
import bundledImagePaths from 'virtual:bundled-images';

function getBundledUrl(filePath: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(filePath);
  }
  return `/${filePath}`;
}

const BUNDLED_PHOTOS: PhotoRecord[] = bundledImagePaths.map((filePath, i) => ({
  id: `bundled-${i + 1}`,
  imageUrl: getBundledUrl(filePath),
  thumbUrl: getBundledUrl(filePath),
  photographer: 'Built-in',
  photographerUrl: '',
  timestamp: 0,
  liked: false,
  source: 'bundled' as const,
}));

function PhotoGrid({ photos, onLike, onSelect, onDelete }: {
  photos: PhotoRecord[];
  onLike: (id: string) => void;
  onSelect: (photo: PhotoRecord) => void;
  onDelete?: (id: string) => void;
}) {
  if (!photos.length) {
    return <p style={{ opacity: 0.5, fontStyle: 'italic', fontSize: 13 }}>No photos yet.</p>;
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <div key={photo.id} className="photo-thumb" onClick={() => onSelect(photo)}>
          <img src={photo.thumbUrl} alt={`Photo by ${photo.photographer}`} />
          <div className="photo-thumb-overlay">
            <span className="photo-thumb-credit">{photo.photographer}</span>
          </div>
          {photo.source !== 'bundled' && (
            <button
              className={`photo-like-btn ${photo.liked ? 'liked' : ''}`}
              onClick={(e) => { e.stopPropagation(); onLike(photo.id); }}
              title={photo.liked ? 'Unlike' : 'Like'}
            >
              <Heart size={14} fill={photo.liked ? 'currentColor' : 'none'} />
            </button>
          )}
          {onDelete && (
            <button
              className="photo-delete-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(photo.id); }}
              title="Delete"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

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
    if (file.size > 5 * 1024 * 1024) {
      showSettingsMessage('Image too large. Maximum size is 5MB', 'error');
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
          onChange={(v) => update('backgroundSource', v as 'unsplash' | 'local')}
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
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, opacity: 0.9 }}>Unsplash Photos</h3>
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
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, opacity: 0.9 }}>Built-in</h3>
            <div className="settings-group">
              <PhotoGrid photos={BUNDLED_PHOTOS} onLike={() => {}} onSelect={setFromPhoto} />
            </div>
          </section>

          <section>
            <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, opacity: 0.9 }}>Local Photos</h3>
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
