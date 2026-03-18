import { useSpotifyTopTracks } from '../../hooks/useSpotify';

export function SpotifyTopTracks() {
  const { tracks } = useSpotifyTopTracks();

  if (!tracks.length) return null;

  return (
    <div className="spotify-top-tracks">
      <div className="spotify-top-tracks-title">Top Tracks</div>
      <div className="spotify-top-tracks-list">
        {tracks.map((track, i) => (
          <a
            key={track.url}
            href={track.url}
            target="_blank"
            rel="noreferrer"
            className="spotify-top-track-item"
          >
            <span className="spotify-top-track-num">{i + 1}</span>
            {track.albumArt ? (
              <img src={track.albumArt} alt={track.album} className="spotify-top-track-art" />
            ) : (
              <div className="spotify-top-track-art-placeholder" />
            )}
            <div className="spotify-top-track-info">
              <div className="spotify-top-track-name">{track.name}</div>
              <div className="spotify-top-track-artist">{track.artist}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
