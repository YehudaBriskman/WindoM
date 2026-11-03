import { useEffect, useId, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { apiFetch, apiGet } from '../../../lib/api';
import { localStore } from '../../../lib/chrome-storage';
import {
  absoluteFormat, formatRelative, orderSessions, plural, summarise, type Session,
} from '../../../utils/sessions';

/** Rows shown before "Show all". */
const VISIBLE_ROWS = 5;
const EXPANDED_KEY = 'activeSessionsExpanded';

/** The one empty placeholder: a dash with a name a screen reader can say. */
function Empty() {
  return <span className="sessions-empty" aria-label="Not available">—</span>;
}

function When({ iso }: { iso: string }) {
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return <Empty />;
  return <time dateTime={iso} title={absoluteFormat.format(ms)}>{formatRelative(ms)}</time>;
}

// ── Component ────────────────────────────────────────────────────────────────

export function ActiveSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reload, setReload] = useState(0);
  const [pending, setPending] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const busy = useRef(false);
  const toggled = useRef(false);
  const regionId = useId();

  // Expanded/collapsed is a per-viewer convenience; a click before it loads wins.
  useEffect(() => {
    let active = true;
    void localStore.get<boolean>(EXPANDED_KEY, false).then((value) => {
      if (active && !toggled.current) setExpanded(value === true);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    apiGet<{ sessions: Session[] }>('/me/sessions')
      .then((data) => { if (active) setSessions(orderSessions(data.sessions)); })
      .catch(() => { if (active) setError('Could not load sessions. Please try again.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reload]);

  function toggle() {
    toggled.current = true;
    const next = !expanded;
    setExpanded(next);
    void localStore.set(EXPANDED_KEY, next);
  }

  function refresh() {
    setNotice('');
    setReload((value) => value + 1);
  }

  async function revoke(session: Session) {
    if (busy.current) return;
    const label = session.device ?? 'Unknown device';
    if (!window.confirm(`Sign out ${label}? It may keep access for up to 15 minutes.`)) return;
    busy.current = true;
    setPending(session.id);
    setError('');
    setNotice('');
    try {
      const response = await apiFetch(`/me/sessions/${encodeURIComponent(session.id)}`, { method: 'DELETE' });
      if (response.status === 404) {
        setError('This session has changed or ended. Refresh the list before trying again.');
      } else if (!response.ok) {
        setError('Could not revoke this session. Please try again.');
      } else {
        setSessions((current) => current.filter((item) => item.id !== session.id));
        setNotice(`Signed out ${label}.`);
      }
    } catch {
      setError('Could not revoke this session. Check your connection and try again.');
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  async function revokeOthers() {
    if (busy.current) return;
    const others = sessions.filter((session) => !session.current).length;
    if (!window.confirm(`Sign out ${plural(others, 'other session', 'other sessions')}? They may keep access for up to 15 minutes.`)) return;
    busy.current = true;
    setPending('others');
    setError('');
    setNotice('');
    try {
      const response = await apiFetch('/me/sessions?others=true', { method: 'DELETE' });
      if (response.status === 409) {
        setError('This device’s session could not be identified. Sign out and back in, then try again.');
      } else if (!response.ok) {
        setError('Could not sign out the other sessions. Please try again.');
      } else {
        const { revoked } = await response.json() as { revoked: number };
        setSessions((current) => current.filter((session) => session.current));
        setNotice(`Signed out ${plural(revoked, 'other session', 'other sessions')}.`);
      }
    } catch {
      setError('Could not sign out the other sessions. Check your connection and try again.');
    } finally {
      busy.current = false;
      setPending(null);
    }
  }

  const hasCurrent = sessions.some((session) => session.current);
  const othersCount = hasCurrent ? sessions.length - 1 : 0;
  const visible = showAll ? sessions : sessions.slice(0, VISIBLE_ROWS);
  const summary = loading ? 'Loading sessions…' : error && sessions.length === 0 ? 'Unavailable' : summarise(sessions);

  return (
    <section className="settings-group sessions" aria-labelledby="active-sessions-title">
      <button
        type="button"
        className="sessions-disclosure"
        aria-expanded={expanded}
        aria-controls={regionId}
        onClick={toggle}
      >
        <span className="sessions-disclosure-text">
          <span id="active-sessions-title" className="sessions-title">Active sessions</span>
          <span className="sessions-summary">{summary}</span>
        </span>
        <ChevronDown size={16} aria-hidden="true" className="sessions-chevron" />
      </button>

      {error && (
        <p role="alert" className="sessions-error">
          {error}{' '}
          <button type="button" className="sessions-link-btn" disabled={loading || pending !== null} onClick={refresh}>
            Refresh
          </button>
        </p>
      )}
      <p className="sr-only" role="status">{notice}</p>

      <div id={regionId} hidden={!expanded} className="sessions-body">
        {!loading && !error && sessions.length === 0 && (
          <p className="settings-hint">No active sessions. Sessions appear here after you sign in.</p>
        )}

        {sessions.length > 0 && (
          <table className="sessions-table">
            <caption className="sr-only">Signed-in browsers, this device first</caption>
            <thead>
              <tr>
                <th scope="col">Device</th>
                <th scope="col" className="sessions-num">Last renewed</th>
                <th scope="col" className="sessions-num sessions-col-expires">Expires</th>
                <th scope="col"><span className="sr-only">Action</span></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((session) => (
                <tr key={session.id} className={session.current ? 'is-current' : undefined}>
                  <th scope="row" className="sessions-device">
                    {session.device
                      ? <span translate="no">{session.device}</span>
                      : <span className="sessions-unknown">Unknown device</span>}
                    {session.current && <span className="sessions-badge">This device</span>}
                    {/* Narrow panel: Expires folds under the device instead of scrolling sideways.
                        Exactly one of this and the Expires column is displayed (CSS). */}
                    <span className="sessions-sub">Expires <When iso={session.expiresAt} /></span>
                  </th>
                  <td className="sessions-num"><When iso={session.lastUsedAt} /></td>
                  <td className="sessions-num sessions-col-expires"><When iso={session.expiresAt} /></td>
                  <td className="sessions-action">
                    {!session.current && (
                      <button
                        type="button"
                        className="sessions-revoke-btn"
                        disabled={pending !== null}
                        aria-label={`Revoke ${session.device ?? 'unknown device'} session, last renewed ${formatRelative(Date.parse(session.lastUsedAt))}`}
                        onClick={() => void revoke(session)}
                      >
                        {pending === session.id ? 'Revoking…' : 'Revoke'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {sessions.length > VISIBLE_ROWS && (
          <button type="button" className="sessions-link-btn sessions-show-all" onClick={() => setShowAll((value) => !value)}>
            {showAll ? 'Show fewer' : `Show all ${sessions.length}`}
          </button>
        )}

        <div className="sessions-footer">
          {othersCount > 0 && (
            <button
              type="button"
              className="sessions-danger-btn"
              disabled={pending !== null || loading}
              onClick={() => void revokeOthers()}
            >
              {pending === 'others' ? 'Signing out…' : 'Sign out all other sessions'}
            </button>
          )}
          <button type="button" className="sessions-link-btn" disabled={loading || pending !== null} onClick={refresh}>
            Refresh
          </button>
        </div>
        <p className="settings-hint">
          Last renewed is the latest sign-in or automatic renewal. A signed-out device may keep
          access for up to 15 minutes.
        </p>
      </div>
    </section>
  );
}
