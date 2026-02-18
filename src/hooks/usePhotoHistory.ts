import { useState, useEffect, useCallback } from 'react';
import { localStorage as ls } from '../lib/chrome-storage';
import type { PhotoRecord } from '../types/photos';

const HISTORY_KEY = 'photoHistory';
const LIKED_KEY = 'likedPhotos';
const LOCAL_HISTORY_KEY = 'localPhotos';
const MAX_HISTORY = 50;
const MAX_LOCAL = 5;

export function usePhotoHistory() {
  const [unsplashHistory, setUnsplashHistory] = useState<PhotoRecord[]>([]);
  const [localHistory, setLocalHistory] = useState<PhotoRecord[]>([]);
  const [liked, setLiked] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    (async () => {
      const h = await ls.get<PhotoRecord[]>(HISTORY_KEY, []);
      const loc = await ls.get<PhotoRecord[]>(LOCAL_HISTORY_KEY, []);
      const l = await ls.get<PhotoRecord[]>(LIKED_KEY, []);
      // Migrate old records without source field
      setUnsplashHistory(h.map((p) => ({ ...p, source: p.source ?? 'unsplash' } as PhotoRecord)));
      setLocalHistory(loc.map((p) => ({ ...p, source: 'local' } as PhotoRecord)));
      setLiked(l.map((p) => ({ ...p, source: p.source ?? 'unsplash' } as PhotoRecord)));
    })();
  }, []);

  const addPhoto = useCallback((photo: Omit<PhotoRecord, 'liked' | 'timestamp' | 'source'>) => {
    const record: PhotoRecord = { ...photo, timestamp: Date.now(), liked: false, source: 'unsplash' };
    setUnsplashHistory((prev) => {
      const deduped = prev.filter((p) => p.id !== record.id);
      const next = [record, ...deduped].slice(0, MAX_HISTORY);
      ls.set(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const addLocalPhoto = useCallback((dataUrl: string, thumbDataUrl: string, filename: string) => {
    const id = `local-${Date.now()}`;
    const record: PhotoRecord = {
      id,
      imageUrl: dataUrl,
      thumbUrl: thumbDataUrl,
      photographer: filename,
      photographerUrl: '',
      timestamp: Date.now(),
      liked: false,
      source: 'local',
    };
    setLocalHistory((prev) => {
      const next = [record, ...prev].slice(0, MAX_LOCAL);
      ls.set(LOCAL_HISTORY_KEY, next);
      return next;
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    let updatedPhoto: PhotoRecord | undefined;

    // Check unsplash history first
    setUnsplashHistory((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedPhoto = { ...p, liked: !p.liked };
          return updatedPhoto;
        }
        return p;
      });
      if (updatedPhoto) ls.set(HISTORY_KEY, next);
      return next;
    });

    // Also check local history
    if (!updatedPhoto) {
      setLocalHistory((prev) => {
        const next = prev.map((p) => {
          if (p.id === id) {
            updatedPhoto = { ...p, liked: !p.liked };
            return updatedPhoto;
          }
          return p;
        });
        if (updatedPhoto) ls.set(LOCAL_HISTORY_KEY, next);
        return next;
      });
    }

    queueMicrotask(() => {
      if (!updatedPhoto) return;
      if (updatedPhoto.liked) {
        setLiked((prev) => {
          const next = [updatedPhoto!, ...prev.filter((p) => p.id !== id)];
          ls.set(LIKED_KEY, next);
          return next;
        });
      } else {
        setLiked((prev) => {
          const next = prev.filter((p) => p.id !== id);
          ls.set(LIKED_KEY, next);
          return next;
        });
      }
    });
  }, []);

  // Keep backward-compat: history = unsplashHistory
  return { history: unsplashHistory, unsplashHistory, localHistory, liked, addPhoto, addLocalPhoto, toggleLike };
}
