/**
 * A real screenshot of the extension, for a guide page about a visual feature.
 *
 * The guide pages described the clock and the sidebar in words only, while the
 * landing page held the two real screenshots that show them (#513). The files
 * are the landing page's own, so this adds no weight the browser has not
 * already fetched, and `loading="lazy"` keeps it off the first screen.
 */
const SHOTS = {
  settings: { src: '/images/shot-settings.webp', width: 1200, height: 949 },
  sidebar: { src: '/images/shot-sidebar.webp', width: 1200, height: 747 },
} as const;

export function GuideShot({ shot, alt, caption }: { shot: keyof typeof SHOTS; alt: string; caption: string }) {
  const s = SHOTS[shot];
  return (
    <figure className="guide-shot">
      <img src={s.src} width={s.width} height={s.height} alt={alt} loading="lazy" decoding="async" />
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
