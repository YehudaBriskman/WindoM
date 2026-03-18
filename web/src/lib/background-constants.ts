export const DEFAULT_GRADIENT = [
  // Glassy light streaks — simulate refraction/reflection through glass
  'linear-gradient(125deg, rgba(255,255,255,0.13) 0%, transparent 38%, rgba(255,255,255,0.07) 58%, transparent 82%)',
  'linear-gradient(218deg, transparent 22%, rgba(255,255,255,0.09) 44%, transparent 66%)',
  'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, transparent 60%)',
  // Color orbs — two-stop fade for a glass-like glow rather than flat blobs
  'radial-gradient(ellipse at 18% 82%, rgba(236, 72, 153, 0.80) 0%, rgba(236, 72, 153, 0.18) 32%, transparent 54%)',   // hot pink
  'radial-gradient(ellipse at 78% 12%, rgba(139, 92, 246, 0.85) 0%, rgba(139, 92, 246, 0.18) 30%, transparent 50%)',   // violet
  'radial-gradient(ellipse at 48% 48%, rgba(99, 102, 241, 0.38) 0%, transparent 52%)',                                  // indigo center bloom
  'radial-gradient(ellipse at 84% 78%, rgba(59, 130, 246, 0.70) 0%, rgba(59, 130, 246, 0.12) 26%, transparent 46%)',   // blue
  'radial-gradient(ellipse at 12% 22%, rgba(192, 132, 252, 0.70) 0%, rgba(192, 132, 252, 0.12) 26%, transparent 44%)', // lavender
  'radial-gradient(ellipse at 64% 70%, rgba(234, 179, 8, 0.72) 0%, rgba(251, 191, 36, 0.18) 28%, transparent 48%)',    // yellow/amber
  'radial-gradient(ellipse at 38% 36%, rgba(251, 146, 60, 0.32) 0%, transparent 30%)',                                  // orange warmth
  // Dark deep-space base
  'linear-gradient(160deg, #0d0221 0%, #1a0533 25%, #0c1445 55%, #1a0f03 100%)',
].join(', ');
