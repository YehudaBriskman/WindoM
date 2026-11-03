import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, apiGet } from '../../../lib/api';
import { ActiveSessions } from './ActiveSessions';
import { formatRelative, orderSessions, summarise, type Session } from '../../../utils/sessions';

vi.mock('../../../lib/api', () => ({ apiFetch: vi.fn(), apiGet: vi.fn() }));

const HOUR = 3_600_000;
const ago = (hours: number) => new Date(Date.now() - hours * HOUR).toISOString();
const ahead = (hours: number) => new Date(Date.now() + hours * HOUR).toISOString();

const sessions: Session[] = [
  { id: 'old', device: 'Firefox · Linux', current: false, lastUsedAt: ago(72), expiresAt: ahead(96) },
  { id: 'mine', device: 'Chrome · Windows', current: true, lastUsedAt: ago(1), expiresAt: ahead(160) },
  { id: 'recent', device: null, current: false, lastUsedAt: ago(5), expiresAt: ahead(150) },
];

// chrome's typings overload get(); the test stub resolves a plain object.
const storageGet = () => chrome.storage.local.get as unknown as ReturnType<typeof vi.fn>;
const revokeButton = (id: string) => screen.getByRole('button', { name: new RegExp(`^Revoke ${id}`) });
const disclosure = () => screen.getByRole('button', { name: /Active sessions/ });
const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1);

async function renderExpanded() {
  render(<ActiveSessions />);
  await screen.findByText(/3 active sessions/);
  fireEvent.click(disclosure());
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiGet).mockResolvedValue({ sessions });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  storageGet().mockResolvedValue({});
  vi.mocked(chrome.storage.local.set).mockResolvedValue(undefined);
});

describe('helpers', () => {
  it('summarises with and without a current session', () => {
    expect(summarise(sessions)).toBe('3 active sessions · this device + 2 others');
    expect(summarise([sessions[1]!])).toBe('1 active session · this device');
    expect(summarise([sessions[0]!, sessions[2]!])).toBe('2 active sessions');
    expect(summarise([sessions[1]!, sessions[0]!])).toBe('2 active sessions · this device + 1 other');
  });

  it('orders the current session first, then by recency', () => {
    expect(orderSessions(sessions).map((s) => s.id)).toEqual(['mine', 'recent', 'old']);
  });

  it('formats relative times in both directions', () => {
    const now = Date.parse('2026-11-03T12:00:00Z');
    expect(formatRelative(now - 3 * 24 * HOUR, now)).toBe('3 days ago');
    expect(formatRelative(now + 2 * HOUR, now)).toBe('in 2 hours');
    expect(formatRelative(now, now)).toBe('now');
  });
});

describe('ActiveSessions', () => {
  it('starts collapsed to a one-line summary and expands with aria-expanded', async () => {
    render(<ActiveSessions />);
    expect(screen.getByText('Loading sessions…')).toBeTruthy();
    await screen.findByText('3 active sessions · this device + 2 others');
    expect(disclosure().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('table')).toBeNull();
    fireEvent.click(disclosure());
    expect(disclosure().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('table')).toBeTruthy();
    expect(chrome.storage.local.set).toHaveBeenCalledWith({ activeSessionsExpanded: true });
  });

  it('restores the expanded state saved by this viewer', async () => {
    storageGet().mockResolvedValue({ activeSessionsExpanded: true });
    render(<ActiveSessions />);
    await waitFor(() => expect(disclosure().getAttribute('aria-expanded')).toBe('true'));
  });

  it('lists this device first with a badge and no revoke, then the rest by recency', async () => {
    await renderExpanded();
    const rows = bodyRows();
    // The row header also carries the narrow-layout "Expires …" line (CSS picks one of the two).
    expect(rows.map((row) => within(row).getByRole('rowheader').textContent?.replace(/Expires.*$/, ''))).toEqual([
      'Chrome · WindowsThis device', 'Unknown device', 'Firefox · Linux',
    ]);
    expect(within(rows[0]!).queryByRole('button')).toBeNull();
    expect(within(rows[1]!).getByRole('button', { name: /Revoke unknown device session/ })).toBeTruthy();
    // Dates are relative, with the absolute value on hover.
    const time = rows[2]!.querySelector('td time');
    expect(time?.textContent).toBe('3 days ago');
    expect(time?.getAttribute('title')).toBeTruthy();
  });

  it('shows one placeholder for an unreadable date', async () => {
    vi.mocked(apiGet).mockResolvedValue({ sessions: [{ ...sessions[0]!, expiresAt: 'garbage' }] });
    render(<ActiveSessions />);
    await screen.findByText('1 active session');
    fireEvent.click(disclosure());
    // Once in the Expires column, once in the narrow fold - CSS displays exactly one.
    const empties = screen.getAllByLabelText('Not available');
    expect(empties.map((el) => el.textContent)).toEqual(['—', '—']);
  });

  it('shows the first five rows, then all on request', async () => {
    const many = Array.from({ length: 7 }, (_, i) => ({
      id: `s${i}`, device: `Chrome · Device ${i}`, current: i === 0, lastUsedAt: ago(i), expiresAt: ahead(24),
    }));
    vi.mocked(apiGet).mockResolvedValue({ sessions: many });
    render(<ActiveSessions />);
    await screen.findByText(/7 active sessions/);
    fireEvent.click(disclosure());
    expect(bodyRows()).toHaveLength(5);
    fireEvent.click(screen.getByRole('button', { name: 'Show all 7' }));
    expect(bodyRows()).toHaveLength(7);
  });

  it('shows an empty state', async () => {
    vi.mocked(apiGet).mockResolvedValue({ sessions: [] });
    render(<ActiveSessions />);
    await screen.findByText('0 active sessions');
    fireEvent.click(disclosure());
    expect(screen.getByText(/No active sessions/)).toBeTruthy();
  });

  it('shows a load failure while collapsed and allows retry', async () => {
    vi.mocked(apiGet).mockRejectedValueOnce(new Error('offline'));
    render(<ActiveSessions />);
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Could not load');
    fireEvent.click(within(alert).getByRole('button', { name: 'Refresh' }));
    await screen.findByText(/3 active sessions/);
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('confirms before revoking and does nothing when cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValueOnce(false);
    await renderExpanded();
    fireEvent.click(revokeButton('Firefox · Linux'));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Firefox · Linux'));
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('removes only the revoked session after confirmation', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));
    await renderExpanded();
    fireEvent.click(revokeButton('Firefox · Linux'));
    await waitFor(() => expect(bodyRows()).toHaveLength(2));
    expect(apiFetch).toHaveBeenCalledWith('/me/sessions/old', { method: 'DELETE' });
    expect(screen.getByText('2 active sessions · this device + 1 other')).toBeTruthy();
  });

  it.each([401, 403, 500])('preserves sessions when revocation returns %s', async (status) => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status }));
    await renderExpanded();
    fireEvent.click(revokeButton('Firefox · Linux'));
    expect((await screen.findByRole('alert')).textContent).toContain('Could not revoke');
    expect((revokeButton('Firefox · Linux') as HTMLButtonElement).disabled).toBe(false);
  });

  it('asks for a refresh when a session has rotated or ended', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 404 }));
    await renderExpanded();
    fireEvent.click(revokeButton('Firefox · Linux'));
    expect((await screen.findByRole('alert')).textContent).toContain('changed or ended');
  });

  it('blocks duplicate revocations while one is pending', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(apiFetch).mockReturnValue(new Promise((done) => { resolve = done; }));
    await renderExpanded();
    const button = revokeButton('Firefox · Linux');
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(revokeButton('unknown device'));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    await act(async () => resolve(new Response(null, { status: 204 })));
    expect((revokeButton('unknown device') as HTMLButtonElement).disabled).toBe(false);
  });

  it('signs out all other sessions after confirmation, keeping this device', async () => {
    vi.mocked(apiFetch).mockResolvedValue(Response.json({ revoked: 2 }));
    await renderExpanded();
    fireEvent.click(screen.getByRole('button', { name: 'Sign out all other sessions' }));
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('2 other sessions'));
    await waitFor(() => expect(bodyRows()).toHaveLength(1));
    expect(apiFetch).toHaveBeenCalledWith('/me/sessions?others=true', { method: 'DELETE' });
    expect(screen.getByText('1 active session · this device')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Sign out all other sessions' })).toBeNull();
  });

  it('does not offer sign-out-all when this device cannot be identified', async () => {
    vi.mocked(apiGet).mockResolvedValue({ sessions: sessions.map((s) => ({ ...s, current: undefined })) });
    render(<ActiveSessions />);
    await screen.findByText('3 active sessions');
    fireEvent.click(disclosure());
    expect(screen.queryByRole('button', { name: 'Sign out all other sessions' })).toBeNull();
    expect(screen.getAllByRole('button', { name: /^Revoke / })).toHaveLength(3);
  });

  it('ignores a response after unmount', async () => {
    let resolve!: (result: { sessions: Session[] }) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const view = render(<ActiveSessions />);
    view.unmount();
    render(<ActiveSessions />);
    await screen.findByText(/3 active sessions/);
    await act(async () => resolve({ sessions: [] }));
    expect(screen.getByText(/3 active sessions/)).toBeTruthy();
  });
});
