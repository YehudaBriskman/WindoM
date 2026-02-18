import { Heart } from 'lucide-react';
import { useBackgroundContext } from '../../../contexts/BackgroundContext';
import type { PhotoRecord } from '../../../types/photos';

function PhotoGrid({ photos, onLike, onSelect }: {
  photos: PhotoRecord[];
  onLike: (id: string) => void;
  onSelect: (photo: PhotoRecord) => void;
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
          <button
            className={`photo-like-btn ${photo.liked ? 'liked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onLike(photo.id);
            }}
            title={photo.liked ? 'Unlike' : 'Like'}
          >
            <Heart size={14} fill={photo.liked ? 'currentColor' : 'none'} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function PhotosSettings() {
  const { setFromPhoto, photoHistory } = useBackgroundContext();
  const { unsplashHistory, localHistory, liked, toggleLike } = photoHistory;

  const unsplashLiked = liked.filter((p) => p.source === 'unsplash' || !p.source);
  const localLiked = liked.filter((p) => p.source === 'local');

  return (
    <div>
      {/* Unsplash Photos */}
      <section style={{ marginBottom: 28 }}>
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

      {/* Local Photos */}
      <section>
        <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 16, opacity: 0.9 }}>Local Photos</h3>

        {localLiked.length > 0 && (
          <div className="settings-group">
            <label className="settings-label" style={{ fontSize: 13, opacity: 0.7 }}>Liked</label>
            <PhotoGrid photos={localLiked} onLike={toggleLike} onSelect={setFromPhoto} />
          </div>
        )}

        <div className="settings-group">
          <label className="settings-label" style={{ fontSize: 13, opacity: 0.7 }}>Recent (up to 5)</label>
          <PhotoGrid photos={localHistory} onLike={toggleLike} onSelect={setFromPhoto} />
        </div>
      </section>
    </div>
  );
}
