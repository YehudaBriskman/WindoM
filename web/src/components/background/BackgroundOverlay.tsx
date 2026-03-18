export function BackgroundOverlay() {
  // Background is managed by BackgroundProvider in App.tsx (sets body background style)
  // This div is just the dark overlay on top of the background image
  return (
    <div className="bg-overlay" />
  );
}
