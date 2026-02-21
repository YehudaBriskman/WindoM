import { useSpotify } from '../../hooks/useSpotify';

export function SpotifyWidget() {
  const { isPlaying, track, spotifyConnected } = useSpotify();

  if (!spotifyConnected || !track) return null;

  return (
    <div className="spotify-widget glass-panel">
      {track.albumArt ? (
        <img
          src={track.albumArt}
          alt={track.album}
          className="spotify-album-art"
        />
      ) : (
        <div className="spotify-album-art-placeholder">
          <MusicIcon />
        </div>
      )}

      <div className="spotify-track-info">
        <div className="spotify-track-name">{track.name}</div>
        <div className="spotify-track-artist">{track.artist}</div>
      </div>

      {isPlaying && (
        <div className="spotify-eq">
          <span className="spotify-eq-bar" />
          <span className="spotify-eq-bar" />
          <span className="spotify-eq-bar" />
        </div>
      )}
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
