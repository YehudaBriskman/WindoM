import type { PhotoRecord } from '../types/photos';
import bundledImagePaths from 'virtual:bundled-images';
import { extensionUrl } from './chrome-runtime';

export const BUNDLED_PHOTOS: PhotoRecord[] = bundledImagePaths.map((filePath, i) => ({
  id: `bundled-${i + 1}`,
  imageUrl: extensionUrl(filePath),
  thumbUrl: extensionUrl(filePath),
  photographer: 'Built-in',
  photographerUrl: '',
  timestamp: 0,
  liked: false,
  source: 'bundled' as const,
}));
