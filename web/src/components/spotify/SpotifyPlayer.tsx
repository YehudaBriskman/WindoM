import { useState } from 'react';
import { useSpotify } from '../../hooks/useSpotify';

export function SpotifyPlayer() {
  const { isPlaying, progressMs, track, spotifyConnected, control } = useSpotify();
  const [hovered, setHovered] = useState(false);

  if (!spotifyConnected) return null;

  const pct = track ? Math.min(100, (progressMs / track.durationMs) * 100) : 0;

  return (
    <div
      className={`spotify-dock glass-dock${hovered ? ' spotify-dock--open' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Disc button — always visible, anchored to left */}
      <button
        className="spotify-dock-disc-btn"
        onClick={() => control(isPlaying ? 'pause' : 'play')}
        title={isPlaying ? 'Pause' : 'Play'}
      >
        <div className={`spotify-dock-disc${isPlaying ? ' spinning' : ''}`}>
          {track?.albumArt ? (
            <img src={track.albumArt} alt="" className="spotify-dock-art" />
          ) : (
            <div className="spotify-dock-art-placeholder">
              <NoteIcon />
            </div>
          )}
        </div>
        {isPlaying && (
          <div className="spotify-dock-eq-overlay">
            <span className="spotify-eq-bar" />
            <span className="spotify-eq-bar" />
            <span className="spotify-eq-bar" />
          </div>
        )}
      </button>

      {/* Expandable right panel — hidden until hover */}
      <div className="spotify-dock-expand">
        <div className="spotify-dock-expand-inner">
          <button
            className="spotify-dock-ctrl"
            onClick={() => control('previous')}
            title="Previous"
          >
            <PrevIcon />
          </button>
          <button
            className="spotify-dock-ctrl"
            onClick={() => control('next')}
            title="Next"
          >
            <NextIcon />
          </button>
          <div className="spotify-dock-info">
            <div className="spotify-dock-track-name">
              {track?.name ?? 'Nothing playing'}
            </div>
            <div className="spotify-dock-progress-bar">
              <div className="spotify-dock-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NoteIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
