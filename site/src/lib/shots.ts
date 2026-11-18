/**
 * The extension screenshots the site shows, with their intrinsic size.
 *
 * One table for the landing page's story beats and the guide pages, so every
 * <img> of them carries width and height: without the pair the browser cannot
 * reserve the space and the text below jumps when the image arrives (CLS).
 */
export const SHOTS = {
  settings: { src: '/images/shot-settings.webp', width: 1200, height: 949 },
  sidebar: { src: '/images/shot-sidebar.webp', width: 1200, height: 747 },
} as const;

export type Shot = keyof typeof SHOTS;
