import { useCallback, useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import type { PhotoRecord } from '../../types/photos';
import { showSettingsMessage } from './SettingsMessage';
import '../ui/feedback.css';

/** An action may resolve `false` (or reject) to report that it did not save. */
type PhotoAction = (id: string) => void | boolean | Promise<unknown>;

interface PhotoGridProps {
  photos: PhotoRecord[];
  onLike: PhotoAction;
  onSelect: (photo: PhotoRecord) => void;
  onDelete?: PhotoAction;
}

export function PhotoGrid({ photos, onLike, onSelect, onDelete }: PhotoGridProps) {
  // Photos with a like/delete write in flight; their buttons are disabled
  // until it settles so a double click cannot fire the action twice.
  const [pending, setPending] = useState<ReadonlySet<string>>(() => new Set());

  const run = useCallback(
    async (id: string, action: PhotoAction, success: string, failure: string) => {
      if (pending.has(id)) return;
      setPending((prev) => new Set(prev).add(id));
      try {
        const result = await action(id);
        if (result === false) showSettingsMessage(failure, 'error');
        else showSettingsMessage(success, 'success');
      } catch {
        showSettingsMessage(failure, 'error');
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [pending],
  );

  if (!photos.length) {
    return <p style={{ opacity: 0.5, fontStyle: 'italic', fontSize: 13 }}>No photos yet.</p>;
  }

  return (
    <div className="photo-grid">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="photo-thumb"
          aria-busy={pending.has(photo.id) || undefined}
          onClick={() => onSelect(photo)}
          onKeyDown={(e) => {
            if (e.currentTarget !== e.target) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(photo);
            }
          }}
          role="button"
          tabIndex={0}
          aria-label={`Select photo by ${photo.photographer}`}
        >
          <img src={photo.thumbUrl} alt={`Photo by ${photo.photographer}`} loading="lazy" />
          <div className="photo-thumb-overlay">
            <span className="photo-thumb-credit">{photo.photographer}</span>
          </div>
          {photo.source !== 'bundled' && (
            <button
              className={`photo-like-btn ${photo.liked ? 'liked' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                void run(
                  photo.id,
                  onLike,
                  photo.liked ? 'Removed from liked photos' : 'Added to liked photos',
                  'Couldn’t save that like. Try again.',
                );
              }}
              disabled={pending.has(photo.id)}
              title={photo.liked ? 'Unlike' : 'Like'}
              aria-label={`Like photo by ${photo.photographer}`}
              aria-pressed={!!photo.liked}
            >
              <Heart size={14} fill={photo.liked ? 'currentColor' : 'none'} />
            </button>
          )}
          {onDelete && (
            <button
              className="photo-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                void run(photo.id, onDelete, 'Photo deleted', 'Couldn’t delete that photo. Try again.');
              }}
              disabled={pending.has(photo.id)}
              title="Delete"
              aria-label={`Delete photo by ${photo.photographer}`}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
