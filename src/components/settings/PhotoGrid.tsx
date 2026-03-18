import { Heart, Trash2 } from 'lucide-react';
import type { PhotoRecord } from '../../types/photos';

interface PhotoGridProps {
  photos: PhotoRecord[];
  onLike: (id: string) => void;
  onSelect: (photo: PhotoRecord) => void;
  onDelete?: (id: string) => void;
}

export function PhotoGrid({ photos, onLike, onSelect, onDelete }: PhotoGridProps) {
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
