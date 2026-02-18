import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { localStorage as ls } from '../lib/chrome-storage';
import { usePhotoHistory } from '../hooks/usePhotoHistory';
import type { PhotoRecord } from '../types/photos';

const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface UnsplashCache {
  imageUrl: string;
  thumbUrl: string;
  photographer: string;
  photographerUrl: string;
  photoId: string;
  timestamp: number;
}

interface BackgroundContextValue {
  photographer: { name: string; url: string } | null;
  currentPhotoId: string | null;
  currentPhotoSource: 'unsplash' | 'local' | null;
  refresh: () => Promise<void>;
  setFromPhoto: (photo: PhotoRecord) => void;
  setFromLocalPhoto: (id: string) => Promise<void>;
  addLocalPhoto: (dataUrl: string, thumbDataUrl: string, filename: string) => void;
  photoHistory: ReturnType<typeof usePhotoHistory>;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [photographer, setPhotographer] = useState<{ name: string; url: string } | null>(null);
  const [currentPhotoId, setCurrentPhotoId] = useState<string | null>(null);
  const [currentPhotoSource, setCurrentPhotoSource] = useState<'unsplash' | 'local' | null>(null);
  const photoHistory = usePhotoHistory();

  // Destructure stable callbacks to avoid recreating loadUnsplash on every photoHistory render
  const { addPhoto } = photoHistory;

  const applyBackground = useCallback((imageUrl: string) => {
    const layer = document.getElementById('bg-zoom-layer');
    if (!layer) return;
    if (imageUrl.startsWith('linear-gradient') || imageUrl.startsWith('radial-gradient')) {
      layer.style.backgroundImage = imageUrl;
    } else {
      const img = new Image();
      img.onload = () => {
        layer.style.backgroundImage = `url('${imageUrl}')`;
      };
      img.onerror = () => {
        layer.style.backgroundImage = DEFAULT_GRADIENT;
      };
      img.src = imageUrl;
    }
  }, []);

  const setFromPhoto = useCallback(async (photo: PhotoRecord) => {
    if (photo.source === 'local') {
      const fullUrl = await ls.get<string | null>(`localPhoto-${photo.id}`, null);
      applyBackground(fullUrl ?? photo.imageUrl);
      setPhotographer(null);
    } else {
      applyBackground(photo.imageUrl);
      setPhotographer({ name: photo.photographer, url: photo.photographerUrl });
    }
    setCurrentPhotoId(photo.id);
    setCurrentPhotoSource(photo.source ?? 'unsplash');
    document.dispatchEvent(new CustomEvent('close-settings'));
  }, [applyBackground]);

  const setFromLocalPhoto = useCallback(async (id: string) => {
    const fullUrl = await ls.get<string | null>(`localPhoto-${id}`, null);
    if (!fullUrl) return;
    applyBackground(fullUrl);
    setPhotographer(null);
    setCurrentPhotoId(id);
    setCurrentPhotoSource('local');
  }, [applyBackground]);

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
    const localImage = await ls.get<string | null>('localBackgroundImage', null);
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
    applyBackground(DEFAULT_GRADIENT);
    setPhotographer(null);
    setCurrentPhotoId(null);
    setCurrentPhotoSource(null);
  }, [settings.localBackground, applyBackground]);

  const refresh = useCallback(async () => {
    if (settings.backgroundSource === 'unsplash') {
      await ls.set('unsplashCache', null);
      loadUnsplash();
    } else {
      loadLocal();
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
      photographer,
      currentPhotoId,
      currentPhotoSource,
      refresh,
      setFromPhoto,
      setFromLocalPhoto,
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
