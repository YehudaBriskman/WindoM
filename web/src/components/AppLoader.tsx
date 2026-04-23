import { useEffect, useState } from 'react';
import { useBackgroundContext } from '../contexts/BackgroundContext';
import { DEFAULT_GRADIENT } from '../lib/background-constants';
import { LOADER_FADE_DURATION_MS } from '../lib/timing-constants';

export function AppLoader() {
  const { backgroundReady } = useBackgroundContext();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!backgroundReady) return;
    // Wait for the CSS fade-out to finish before unmounting
    const id = setTimeout(() => setHidden(true), LOADER_FADE_DURATION_MS);
    return () => clearTimeout(id);
  }, [backgroundReady]);

  if (hidden) return null;

  return (
    <div className={`app-loader ${backgroundReady ? 'app-loader--done' : ''}`} style={{ backgroundImage: DEFAULT_GRADIENT }}>
      <div className="app-loader-spinner" />
    </div>
  );
}
