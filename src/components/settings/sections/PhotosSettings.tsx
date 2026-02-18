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
  const { history, liked, toggleLike } = photoHistory;

  return (
    <div>
      {liked.length > 0 && (
        <div className="settings-group">
          <label className="settings-label" style={{ fontSize: 15, fontWeight: 500 }}>
            Liked Photos
          </label>
          <PhotoGrid photos={liked} onLike={toggleLike} onSelect={setFromPhoto} />
        </div>
      )}

      <div className="settings-group">
        <label className="settings-label" style={{ fontSize: 15, fontWeight: 500 }}>
          Recent Photos
        </label>
        <PhotoGrid photos={history} onLike={toggleLike} onSelect={setFromPhoto} />
      </div>
    </div>
  );
}
