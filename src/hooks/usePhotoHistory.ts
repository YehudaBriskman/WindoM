import { useState, useEffect, useCallback } from 'react';
import { localStorage as ls } from '../lib/chrome-storage';
import type { PhotoRecord } from '../types/photos';

const HISTORY_KEY = 'photoHistory';
const LIKED_KEY = 'likedPhotos';
const MAX_HISTORY = 50;

export function usePhotoHistory() {
  const [history, setHistory] = useState<PhotoRecord[]>([]);
  const [liked, setLiked] = useState<PhotoRecord[]>([]);

  useEffect(() => {
    (async () => {
      const h = await ls.get<PhotoRecord[]>(HISTORY_KEY, []);
      const l = await ls.get<PhotoRecord[]>(LIKED_KEY, []);
      setHistory(h);
      setLiked(l);
    })();
  }, []);

  const addPhoto = useCallback((photo: Omit<PhotoRecord, 'liked' | 'timestamp'>) => {
    const record: PhotoRecord = { ...photo, timestamp: Date.now(), liked: false };
    setHistory((prev) => {
      const deduped = prev.filter((p) => p.id !== record.id);
      const next = [record, ...deduped].slice(0, MAX_HISTORY);
      ls.set(HISTORY_KEY, next);
      return next;
    });
  }, []);

  const toggleLike = useCallback((id: string) => {
    let updatedPhoto: PhotoRecord | undefined;

    setHistory((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          updatedPhoto = { ...p, liked: !p.liked };
          return updatedPhoto;
        }
        return p;
      });
      ls.set(HISTORY_KEY, next);
      return next;
    });

    // Use a microtask to ensure updatedPhoto is set from the history update
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

  return { history, liked, addPhoto, toggleLike };
}
