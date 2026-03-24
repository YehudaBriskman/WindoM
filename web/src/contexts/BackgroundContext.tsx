import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { useAuth } from './AuthContext';
import { localStore as ls } from '../lib/chrome-storage';
import { usePhotoHistory } from '../hooks/usePhotoHistory';
import { SETTINGS_EVENT } from '../lib/settings-events';
import { DEFAULT_GRADIENT } from '../lib/background-constants';
import type { PhotoRecord } from '../types/photos';

const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const BUNDLED_BG_URL = (typeof chrome !== 'undefined' && chrome.runtime?.getURL)
  ? chrome.runtime.getURL('images/bundled-bg.jpg')
  : '/images/bundled-bg.jpg';

interface UnsplashCache {
  imageUrl: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  photoId: string;
  timestamp: number;
}

interface BackgroundContextValue {
  backgroundReady: boolean;
  photographer: { name: string; url: string } | null;
  currentPhotoId: string | null;
  currentPhotoSource: 'unsplash' | 'local' | 'bundled' | null;
  refresh: () => Promise<void>;
  setFromPhoto: (photo: PhotoRecord) => Promise<void>;
  setFromLocalPhoto: (id: string) => Promise<void>;
  setUploadedBackground: (dataUrl: string) => Promise<void>;
  addLocalPhoto: (dataUrl: string, thumbDataUrl: string, filename: string) => void;
  photoHistory: ReturnType<typeof usePhotoHistory>;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const [backgroundReady, setBackgroundReady] = useState(false);
  const [photographer, setPhotographer] = useState<{ name: string; url: string } | null>(null);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [currentPhotoSource, setCurrentPhotoSource] = useState<'unsplash' | 'local' | 'bundled' | null>(null);
  const photoHistory = usePhotoHistory();

  // Per-user storage key: isolates each account's local background on this device.
  // Falls back to the global key when no user is signed in.
  const bgImageKey = useMemo(
    () => (user?.id ? `localBackgroundImage_${user.id}` : 'localBackgroundImage'),
    [user?.id],
  );

  // Destructure stable callbacks to avoid recreating loadUnsplash on every photoHistory render
  const { addPhoto } = photoHistory;

  const applyBackground = useCallback((imageUrl: string) => {
    const layer = document.getElementById('bg-zoom-layer');
    if (!layer) return;
    if (imageUrl.startsWith('linear-gradient') || imageUrl.startsWith('radial-gradient')) {
      layer.style.backgroundImage = imageUrl;
      setBackgroundReady(true);
    } else {
      const img = new Image();
      img.onload = () => {
        layer.style.backgroundImage = `url('${imageUrl}')`;
        setBackgroundReady(true);
      };
      img.onerror = () => {
        layer.style.backgroundImage = DEFAULT_GRADIENT;
        setBackgroundReady(true);
      };
      img.src = imageUrl;
    }
  }, []);

  const setFromPhoto = useCallback(async (photo: PhotoRecord) => {
    if (photo.source === 'local') {
      const fullUrl = await ls.get<string | null>(`localPhoto-${photo.id}`, null);
      const url = fullUrl ?? photo.imageUrl;
      await ls.set(bgImageKey, url);
      applyBackground(url);
      setPhotographer(null);
    } else if (photo.source === 'bundled') {
      await ls.set(bgImageKey, photo.imageUrl);
      applyBackground(photo.imageUrl);
      setPhotographer(null);
    } else {
      await ls.set('unsplashCache', {
        imageUrl: photo.imageUrl,
        thumbUrl: photo.thumbUrl,
        photographer: photo.photographer,
        photographerUrl: photo.photographerUrl,
        photoId: photo.id,
        timestamp: Date.now(),
      });
      applyBackground(photo.imageUrl);
      setPhotographer({ name: photo.photographer, url: photo.photographerUrl });
    }
    setCurrentPhotoId(photo.id);
    setCurrentPhotoSource(photo.source ?? 'unsplash');
    document.dispatchEvent(new CustomEvent(SETTINGS_EVENT.CLOSE));
  }, [bgImageKey, applyBackground]);

  const setFromLocalPhoto = useCallback(async (id: string) => {
    const fullUrl = await ls.get<string | null>(`localPhoto-${id}`, null);
    if (!fullUrl) return;
    await ls.set(bgImageKey, fullUrl);
    applyBackground(fullUrl);
    setPhotographer(null);
    setCurrentPhotoId(id);
    setCurrentPhotoSource('local');
  }, [bgImageKey, applyBackground]);

  // Used by BackgroundSettings upload handler — writes to the correct per-user key.
  const setUploadedBackground = useCallback(async (dataUrl: string) => {
    await ls.set(bgImageKey, dataUrl);
    applyBackground(dataUrl);
    setPhotographer(null);
    setCurrentPhotoId(null);
    setCurrentPhotoSource('local');
  }, [bgImageKey, applyBackground]);

  const loadUnsplash = useCallback(async () => {
    const cached = await ls.get<UnsplashCache | null>('unsplashCache', null);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      applyBackground(cached.imageUrl);
      setPhotographer({ name: cached.photographer, url: cached.photographerUrl });
      setCurrentPhotoId(cached.photoId);
      setCurrentPhotoSource('unsplash');
      return;
    }

    if (!settings.unsplashApiKey) {
      applyBackground(DEFAULT_GRADIENT);
      setPhotographer(null);
      setCurrentPhotoSource(null);
      return;
    }

    try {
      const res = await fetch(`${UNSPLASH_API_URL}?orientation=landscape&query=nature`, {
        headers: { Authorization: `Client-ID ${settings.unsplashApiKey}` },
      });
      if (!res.ok) throw new Error(`Unsplash API error: ${res.status}`);
      const data = await res.json();

      const imageData: UnsplashCache = {
        imageUrl: data.urls.full,
        thumbUrl: data.urls.small,
        photographer: data.user.name,
        photographerUrl: data.user.links.html,
        photoId: data.id,
        timestamp: Date.now(),
      };

      await ls.set('unsplashCache', imageData);
      applyBackground(imageData.imageUrl);
      setPhotographer({ name: imageData.photographer, url: imageData.photographerUrl });
      setCurrentPhotoId(imageData.photoId);
      setCurrentPhotoSource('unsplash');

      addPhoto({
        id: imageData.photoId,
        imageUrl: imageData.imageUrl,
        thumbUrl: imageData.thumbUrl,
        photographer: imageData.photographer,
        photographerUrl: imageData.photographerUrl,
      });
    } catch (error) {
      console.error('Error loading Unsplash image:', error);
      applyBackground(DEFAULT_GRADIENT);
      setPhotographer(null);
      setCurrentPhotoSource(null);
    }
  // addPhoto is a stable useCallback — safe dep; do NOT add photoHistory here
  }, [settings.unsplashApiKey, applyBackground, addPhoto]);

  const loadLocal = useCallback(async () => {
    let localImage = await ls.get<string | null>(bgImageKey, null);

    // Migration: on first login (user-specific key is empty), copy the global key so
    // any background set before signing in persists for this account.
    if (!localImage && bgImageKey !== 'localBackgroundImage') {
      const globalImage = await ls.get<string | null>('localBackgroundImage', null);
      if (globalImage) {
        await ls.set(bgImageKey, globalImage);
        localImage = globalImage;
      }
    }

    if (localImage) {
      const imageData = Array.isArray(localImage) ? localImage[0] : localImage;
      applyBackground(imageData);
      setPhotographer(null);
      setCurrentPhotoId(null);
      setCurrentPhotoSource('local');
      return;
    }
    if (settings.localBackground) {
      applyBackground(settings.localBackground);
      setPhotographer(null);
      setCurrentPhotoId(null);
      setCurrentPhotoSource('local');
      return;
    }
    applyBackground(BUNDLED_BG_URL);
    setPhotographer(null);
    setCurrentPhotoId('bundled-1');
    setCurrentPhotoSource('bundled');
  }, [bgImageKey, settings.localBackground, applyBackground]);

  const refresh = useCallback(async () => {
    if (settings.backgroundSource === 'unsplash') {
      await ls.set('unsplashCache', null);
      await loadUnsplash();
    } else {
      await loadLocal();
    }
  }, [settings.backgroundSource, loadUnsplash, loadLocal]);

  useEffect(() => {
    if (settings.backgroundSource === 'local') {
      loadLocal();
    } else {
      loadUnsplash();
    }
  }, [settings.backgroundSource, loadUnsplash, loadLocal]);

  return (
    <BackgroundContext.Provider value={{
      backgroundReady,
      photographer,
      currentPhotoId,
      currentPhotoSource,
      refresh,
      setFromPhoto,
      setFromLocalPhoto,
      setUploadedBackground,
      addLocalPhoto: photoHistory.addLocalPhoto,
      photoHistory,
    }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundContext() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error('useBackgroundContext must be used within BackgroundProvider');
  return ctx;
}
