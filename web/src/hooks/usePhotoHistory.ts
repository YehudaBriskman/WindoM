import { useState, useEffect, useCallback, useRef } from 'react';
import { localStore as ls } from '../lib/chrome-storage';
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

  // Latest lists, for the actions below that must compute their writes up
  // front (so they can return a promise for them) instead of inside a state
  // updater, which React may run later or more than once.
  const latest = useRef({ unsplash: unsplashHistory, local: localHistory, liked });
  useEffect(() => {
    latest.current = { unsplash: unsplashHistory, local: localHistory, liked };
  }, [unsplashHistory, localHistory, liked]);

  useEffect(() => {
    (async () => {
      const h = await ls.get<PhotoRecord[]>(HISTORY_KEY, []);
      const loc = await ls.get<PhotoRecord[]>(LOCAL_HISTORY_KEY, []);
      const l = await ls.get<PhotoRecord[]>(LIKED_KEY, []);
      setUnsplashHistory(h.map((p) => ({ ...p, source: p.source ?? 'unsplash' }) as PhotoRecord));
      setLocalHistory(loc.map((p) => ({ ...p, source: 'local' }) as PhotoRecord));
      setLiked(l.map((p) => ({ ...p, source: p.source ?? 'unsplash' }) as PhotoRecord));
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
    // Store full image separately to avoid bloating the metadata array
    ls.set(`localPhoto-${id}`, dataUrl);

    const record: PhotoRecord = {
      id,
      imageUrl: thumbDataUrl, // thumbnail only in the metadata record
      thumbUrl: thumbDataUrl,
      photographer: filename,
      photographerUrl: '',
      timestamp: Date.now(),
      liked: false,
      source: 'local',
    };
    setLocalHistory((prev) => {
      const next = [record, ...prev].slice(0, MAX_LOCAL);
      // When evicting old records, clean up their full image storage
      const evicted = prev.slice(MAX_LOCAL - 1);
      evicted.forEach((p) => ls.set(`localPhoto-${p.id}`, null));
      ls.set(LOCAL_HISTORY_KEY, next);
      return next;
    });
  }, []);

  /** Resolves true once every storage write for the toggle has landed. */
  const toggleLike = useCallback(async (id: string): Promise<boolean> => {
    const { unsplash, local, liked: likedNow } = latest.current;
    const current =
      unsplash.find((p) => p.id === id) ?? local.find((p) => p.id === id) ?? likedNow.find((p) => p.id === id);
    if (!current) return false;
    const updated: PhotoRecord = { ...current, liked: !current.liked };
    const swap = (list: PhotoRecord[]) => list.map((p) => (p.id === id ? updated : p));
    const writes: Promise<boolean>[] = [];

    let nextUnsplash = unsplash;
    if (unsplash.some((p) => p.id === id)) {
      nextUnsplash = swap(unsplash);
      setUnsplashHistory(nextUnsplash);
      writes.push(ls.set(HISTORY_KEY, nextUnsplash));
    }
    let nextLocal = local;
    if (local.some((p) => p.id === id)) {
      nextLocal = swap(local);
      setLocalHistory(nextLocal);
      writes.push(ls.set(LOCAL_HISTORY_KEY, nextLocal));
    }
    const others = likedNow.filter((p) => p.id !== id);
    const nextLiked = updated.liked ? [updated, ...others] : others;
    setLiked(nextLiked);
    writes.push(ls.set(LIKED_KEY, nextLiked));

    latest.current = { unsplash: nextUnsplash, local: nextLocal, liked: nextLiked };
    return (await Promise.all(writes)).every(Boolean);
  }, []);

  /** Resolves true once the photo and every list referencing it are rewritten. */
  const deleteLocalPhoto = useCallback(async (id: string): Promise<boolean> => {
    const { unsplash, local, liked: likedNow } = latest.current;
    const nextLocal = local.filter((p) => p.id !== id);
    const nextLiked = likedNow.filter((p) => p.id !== id);
    setLocalHistory(nextLocal);
    setLiked(nextLiked);
    latest.current = { unsplash, local: nextLocal, liked: nextLiked };
    const results = await Promise.all([
      ls.set(`localPhoto-${id}`, null),
      ls.set(LOCAL_HISTORY_KEY, nextLocal),
      ls.set(LIKED_KEY, nextLiked),
    ]);
    return results.every(Boolean);
  }, []);

  return { unsplashHistory, localHistory, liked, addPhoto, addLocalPhoto, toggleLike, deleteLocalPhoto };
}
