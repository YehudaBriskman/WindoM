import { STAGES, DAY } from '../lib/day';

/**
 * The four bundled backgrounds, fanned.
 *
 * The stage showed them one at a time over a full scroll; this is the set in
 * one frame, which is the only place the page says "four" and shows four. They
 * are the same files the extension installs with, at the same resolution the
 * stage uses - no extra weight.
 */
export function Wallpapers() {
  return (
    <ul className="fan" aria-label="The four bundled backgrounds">
      {STAGES.map((s, i) => (
        <li className="fan-card" key={s} style={{ '--i': i } as React.CSSProperties}>
          <img src={DAY[s].wallpaper} alt={DAY[s].scene} loading="lazy" decoding="async" />
          <span className="fan-label">{s}</span>
        </li>
      ))}
    </ul>
  );
}
