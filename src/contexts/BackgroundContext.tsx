import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useSettings } from './SettingsContext';
import { localStorage as ls } from '../lib/chrome-storage';

const UNSPLASH_API_URL = 'https://api.unsplash.com/photos/random';
const CACHE_DURATION = 24 * 60 * 60 * 1000;
const DEFAULT_GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface UnsplashCache {
  imageUrl: string;
  photographer: string;
  photographerUrl: string;
  timestamp: number;
}

interface BackgroundContextValue {
  photographer: { name: string; url: string } | null;
  refresh: () => Promise<void>;
}

const BackgroundContext = createContext<BackgroundContextValue | null>(null);

export function BackgroundProvider({ children }: { children: ReactNode }) {
  const { settings } = useSettings();
  const [photographer, setPhotographer] = useState<{ name: string; url: string } | null>(null);

  const applyBackground = useCallback((imageUrl: string) => {
    if (imageUrl.startsWith('linear-gradient') || imageUrl.startsWith('radial-gradient')) {
      document.body.style.backgroundImage = imageUrl;
    } else {
      const img = new Image();
      img.onload = () => {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        document.body.style.transition = 'background-image 0.5s ease-in-out';
      };
      img.onerror = () => {
        document.body.style.backgroundImage = DEFAULT_GRADIENT;
      };
      img.src = imageUrl;
    }
  }, []);

  const loadUnsplash = useCallback(async () => {
    const cached = await ls.get<UnsplashCache | null>('unsplashCache', null);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      applyBackground(cached.imageUrl);
      setPhotographer({ name: cached.photographer, url: cached.photographerUrl });
      return;
    }

    if (!settings.unsplashApiKey) {
      applyBackground(DEFAULT_GRADIENT);
      setPhotographer(null);
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
        photographer: data.user.name,
        photographerUrl: data.user.links.html,
        timestamp: Date.now(),
      };

      await ls.set('unsplashCache', imageData);
      applyBackground(imageData.imageUrl);
      setPhotographer({ name: imageData.photographer, url: imageData.photographerUrl });
    } catch (error) {
      console.error('Error loading Unsplash image:', error);
      applyBackground(DEFAULT_GRADIENT);
      setPhotographer(null);
    }
  }, [settings.unsplashApiKey, applyBackground]);

  const loadLocal = useCallback(async () => {
    const localImage = await ls.get<string | null>('localBackgroundImage', null);
    if (localImage) {
      const imageData = Array.isArray(localImage) ? localImage[0] : localImage;
      applyBackground(imageData);
      setPhotographer(null);
      return;
    }
    if (settings.localBackground) {
      applyBackground(settings.localBackground);
      setPhotographer(null);
      return;
    }
    applyBackground(DEFAULT_GRADIENT);
    setPhotographer(null);
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
    <BackgroundContext.Provider value={{ photographer, refresh }}>
      {children}
    </BackgroundContext.Provider>
  );
}

export function useBackgroundContext() {
  const ctx = useContext(BackgroundContext);
  if (!ctx) throw new Error('useBackgroundContext must be used within BackgroundProvider');
  return ctx;
}
