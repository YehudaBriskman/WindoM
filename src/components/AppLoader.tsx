import { useEffect, useState } from 'react';
import { useBackgroundContext } from '../contexts/BackgroundContext';

export function AppLoader() {
  const { backgroundReady } = useBackgroundContext();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (!backgroundReady) return;
    // Wait for the CSS fade-out to finish before unmounting
    const id = setTimeout(() => setHidden(true), 600);
    return () => clearTimeout(id);
  }, [backgroundReady]);

  if (hidden) return null;

  return (
    <div className={`app-loader ${backgroundReady ? 'app-loader--done' : ''}`}>
      <div className="app-loader-spinner" />
    </div>
  );
}
