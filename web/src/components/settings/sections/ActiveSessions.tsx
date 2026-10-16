import { useEffect, useRef, useState } from 'react';
import { apiFetch, apiGet } from '../../../lib/api';

interface Session {
  id: string;
  deviceId: string;
  lastUsedAt: string;
  expiresAt: string;
}

export function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  const [revoking, setRevoking] = useState<string | null>(null);
  const busy = useRef(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiGet<{ sessions: Session[] }>('/me/sessions')
      .then((data) => { if (active) setSessions(data.sessions); })
      .catch(() => { if (active) setError('Could not load sessions. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  async function revoke(id: string) {
    if (busy.current) return;
    busy.current = true;
    setRevoking(id);
    setError('');
    try {
      const response = await apiFetch(`/me/sessions/${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (response.status === 404) {
        setError('This session has changed or ended. Refresh the list before trying again.');
      } else if (!response.ok) {
        setError('Could not revoke this session. Please try again.');
      } else {
        setSessions((current) => current.filter((session) => session.id !== id));
      }
    } catch {
      setError('Could not revoke this session. Check your connection and try again.');
    } finally {
      busy.current = false;
      setRevoking(null);
    }
  }

  return (
    <section className="settings-group" aria-labelledby="active-sessions-title">
      <h3 id="active-sessions-title" className="settings-label">Active sessions</h3>
      <p className="settings-hint">
        Browser identifiers are anonymous and may match across devices. Last refreshed shows
        the latest sign-in or session renewal. Revoking prevents renewal; access may continue
        for up to 15 minutes, including on this device.
      </p>
      <button className="settings-save-btn" disabled={loading || revoking !== null}
        onClick={() => setReload((value) => value + 1)}>Refresh sessions</button>
      {loading && <p role="status" className="settings-hint">Loading sessions…</p>}
      {error && <p role="alert" className="auth-field-error">{error}</p>}
      {!loading && !error && sessions.length === 0 && <p className="settings-hint">No active sessions.</p>}
      {!loading && sessions.map((session) => (
        <div key={session.id} className="settings-section-mt">
          <p className="settings-label">Browser {session.deviceId || 'unknown'}</p>
          <p className="settings-hint">Last refreshed: {new Date(session.lastUsedAt).toLocaleString()}</p>
          <p className="settings-hint">Expires: {new Date(session.expiresAt).toLocaleString()}</p>
          <button className="settings-save-btn" disabled={revoking !== null}
            aria-label={`Revoke session ${session.id}`} onClick={() => void revoke(session.id)}>
            {revoking === session.id ? 'Revoking…' : 'Revoke session'}
          </button>
        </div>
      ))}
    </section>
  );
}
