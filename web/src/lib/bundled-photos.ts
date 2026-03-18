import type { PhotoRecord } from '../types/photos';
import bundledImagePaths from 'virtual:bundled-images';

export function getBundledUrl(filePath: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(filePath);
  }
  return `/${filePath}`;
}

export const BUNDLED_PHOTOS: PhotoRecord[] = bundledImagePaths.map((filePath, i) => ({
  id: `bundled-${i + 1}`,
  imageUrl: getBundledUrl(filePath),
  thumbUrl: getBundledUrl(filePath),
  photographer: 'Built-in',
  photographerUrl: '',
  timestamp: 0,
  liked: false,
  source: 'bundled' as const,
}));
