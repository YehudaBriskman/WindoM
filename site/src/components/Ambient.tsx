/**
 * The ambient field behind the scrolling content.
 *
 * Rebuilt from the old site's inline SVG, which was duplicated into all five
 * pages with slightly different opacities. The two traces overshoot the viewBox
 * on both sides (x from -220 to 1660 on a 1440 box) so neither endpoint is ever
 * visible - it reads as a line passing through rather than one that starts and
 * stops.
 */
export function Ambient() {
  return (
    <svg
      className="ambient-svg"
      viewBox="0 0 1440 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="orb-blue">
          <stop offset="0%" stopColor="#7b9ef5" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#7b9ef5" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="orb-violet">
          <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle className="orb orb-1" cx="190" cy="270" r="320" fill="url(#orb-blue)" />
      <circle className="orb orb-2" cx="1280" cy="520" r="260" fill="url(#orb-violet)" />

      <path
        className="trace"
        d="M -220 380 Q 320 80 720 400 Q 1120 720 1660 280"
        fill="none"
        stroke="#7b9ef5"
        strokeWidth="1.2"
        strokeOpacity="0.2"
        strokeDasharray="3000"
      />
      <path
        className="trace"
        d="M -220 640 Q 380 880 760 580 Q 1140 280 1660 620"
        fill="none"
        stroke="#a78bfa"
        strokeWidth="1"
        strokeOpacity="0.15"
        strokeDasharray="3000"
      />
    </svg>
  );
}
