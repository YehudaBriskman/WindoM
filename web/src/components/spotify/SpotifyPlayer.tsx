import { useSpotify } from '../../hooks/useSpotify';

export function SpotifyPlayer() {
  const { isPlaying, progressMs, track, spotifyConnected, error, control } = useSpotify();

  if (!spotifyConnected) return null;

  const pct = track ? Math.min(100, (progressMs / track.durationMs) * 100) : 0;

  return (
    <div className="spotify-player glass-panel">
      {/* Top row: art + track info + eq */}
      <div className="spotify-player-row">
        {track?.albumArt ? (
          <img src={track.albumArt} alt={track.album} className="spotify-player-art" />
        ) : (
          <div className="spotify-player-art-placeholder">
            <MusicIcon />
          </div>
        )}

        <div className="spotify-player-info">
          {track ? (
            <a href={track.url} target="_blank" rel="noreferrer" className="spotify-player-track-link">
              <div className="spotify-player-track-name">{track.name}</div>
              <div className="spotify-player-track-artist">{track.artist}</div>
            </a>
          ) : (
            <>
              <div className="spotify-player-track-name spotify-player-nothing">Nothing playing</div>
            </>
          )}
        </div>

        {isPlaying && (
          <div className="spotify-eq">
            <span className="spotify-eq-bar" />
            <span className="spotify-eq-bar" />
            <span className="spotify-eq-bar" />
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className="spotify-player-progress-bar">
        <div className="spotify-player-progress-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Error hint */}
      {error && (
        <div className="spotify-player-error">{error}</div>
      )}

      {/* Controls */}
      <div className="spotify-player-controls">
        <button
          type="button"
          className="spotify-ctrl-btn"
          onClick={() => control('previous')}
          aria-label="Previous track"
        >
          <PrevIcon />
        </button>
        <button
          type="button"
          className="spotify-ctrl-btn spotify-ctrl-btn--main"
          onClick={() => control(isPlaying ? 'pause' : 'play')}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          type="button"
          className="spotify-ctrl-btn"
          onClick={() => control('next')}
          aria-label="Next track"
        >
          <NextIcon />
        </button>
      </div>
    </div>
  );
}

function MusicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" strokeLinecap="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  );
}

function PrevIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="19,20 9,12 19,4" />
      <line x1="5" y1="4" x2="5" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  );
}

function NextIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="5,4 15,12 5,20" />
      <line x1="19" y1="4" x2="19" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
    </svg>
  );
}
