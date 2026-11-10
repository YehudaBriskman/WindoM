import { STAGES, DAY, wallpaperSrcSet } from '../lib/day';

/**
 * The four bundled backgrounds, fanned.
 *
 * The stage showed them one at a time over a full scroll; this is the set in
 * one frame, which is the only place the page says "four" and shows four. They
 * are the same files the extension installs with, at the same resolution the
 * stage uses - no extra weight.
 */
const LABELS = {
  en: {
    list: 'The four bundled backgrounds',
    stages: { morning: 'morning', afternoon: 'afternoon', evening: 'evening', night: 'night' },
  },
  he: { list: 'ארבעת הרקעים המובנים', stages: { morning: 'בוקר', afternoon: 'צהריים', evening: 'ערב', night: 'לילה' } },
} as const;

export function Wallpapers({ locale = 'en' }: { locale?: 'en' | 'he' }) {
  const t = LABELS[locale];
  return (
    <ul className="fan" aria-label={t.list}>
      {STAGES.map((s, i) => (
        <li className="fan-card" key={s} style={{ '--i': i } as React.CSSProperties}>
          <img
            src={DAY[s].wallpaper.replace(/\.webp$/, '-640.webp')}
            srcSet={wallpaperSrcSet(s)}
            sizes="(max-width: 700px) 46vw, (max-width: 1100px) 22vw, 260px"
            width="640"
            height="385"
            alt={locale === 'he' ? '' : DAY[s].scene}
            loading="lazy"
            decoding="async"
          />
          <span className="fan-label">{t.stages[s]}</span>
        </li>
      ))}
    </ul>
  );
}
