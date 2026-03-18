export function GlassFilters() {
  return (
    <svg style={{ display: 'none' }} aria-hidden="true">
      <filter id="glass-distort" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
        <feDisplacementMap in="SourceGraphic" in2="blur" scale="60" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <filter id="glass-distort-sm" x="0%" y="0%" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.012 0.012" numOctaves="2" seed="42" result="noise" />
        <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
        <feDisplacementMap in="SourceGraphic" in2="blur" scale="30" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}
