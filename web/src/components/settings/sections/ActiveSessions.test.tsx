import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch, apiGet } from '../../../lib/api';
import { ActiveSessions } from './ActiveSessions';

vi.mock('../../../lib/api', () => ({ apiFetch: vi.fn(), apiGet: vi.fn() }));

const sessions = ['one', 'two'].map((id) => ({
  id, deviceId: 'abc123', lastUsedAt: '2026-10-16T10:00:00Z', expiresAt: '2026-10-23T10:00:00Z',
}));
const revokeButton = (id = 'one') => screen.getByRole('button', { name: `Revoke session ${id}` });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(apiGet).mockResolvedValue({ sessions });
});

describe('ActiveSessions', () => {
  it('loads sessions and distinguishes sessions sharing a browser identifier', async () => {
    render(<ActiveSessions />);
    expect(screen.getByRole('status').textContent).toBe('Loading sessions…');
    await screen.findByRole('button', { name: 'Revoke session one' });
    expect(revokeButton('two')).toBeTruthy();
    expect(apiGet).toHaveBeenCalledWith('/me/sessions');
    expect(screen.getByText(/up to 15 minutes/)).toBeTruthy();
  });

  it('shows an empty state', async () => {
    vi.mocked(apiGet).mockResolvedValue({ sessions: [] });
    render(<ActiveSessions />);
    expect(await screen.findByText('No active sessions.')).toBeTruthy();
  });

  it('allows retry after a load failure', async () => {
    vi.mocked(apiGet).mockRejectedValueOnce(new Error('offline'));
    render(<ActiveSessions />);
    expect((await screen.findByRole('alert')).textContent).toContain('Could not load');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }));
    await screen.findByRole('button', { name: 'Revoke session one' });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('removes only the revoked session and accepts an empty 204 response', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 204 }));
    render(<ActiveSessions />);
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke session one' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Revoke session one' })).toBeNull());
    expect(revokeButton('two')).toBeTruthy();
    expect(apiFetch).toHaveBeenCalledWith('/me/sessions/one', { method: 'DELETE' });
  });

  it.each([401, 403, 500])('preserves sessions when revocation returns %s', async (status) => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status }));
    render(<ActiveSessions />);
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke session one' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Could not revoke');
    expect((revokeButton() as HTMLButtonElement).disabled).toBe(false);
  });

  it('asks for a refresh when a session has rotated or ended', async () => {
    vi.mocked(apiFetch).mockResolvedValue(new Response(null, { status: 404 }));
    render(<ActiveSessions />);
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke session one' }));
    expect((await screen.findByRole('alert')).textContent).toContain('changed or ended');
    vi.mocked(apiGet).mockResolvedValue({ sessions: [sessions[1]] });
    fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Revoke session one' })).toBeNull());
    expect(await screen.findByRole('button', { name: 'Revoke session two' })).toBeTruthy();
  });

  it('allows retry after a network failure', async () => {
    vi.mocked(apiFetch).mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    render(<ActiveSessions />);
    fireEvent.click(await screen.findByRole('button', { name: 'Revoke session one' }));
    expect((await screen.findByRole('alert')).textContent).toContain('connection');
    fireEvent.click(revokeButton());
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Revoke session one' })).toBeNull());
  });

  it('blocks duplicate revocations and list refresh while revocation is pending', async () => {
    let resolve!: (response: Response) => void;
    vi.mocked(apiFetch).mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<ActiveSessions />);
    const button = await screen.findByRole('button', { name: 'Revoke session one' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(revokeButton('two'));
    fireEvent.click(screen.getByRole('button', { name: 'Refresh sessions' }));
    expect(apiFetch).toHaveBeenCalledTimes(1);
    expect(apiGet).toHaveBeenCalledTimes(1);
    await act(async () => resolve(new Response(null, { status: 204 })));
    expect((revokeButton('two') as HTMLButtonElement).disabled).toBe(false);
  });

  it('ignores a response after unmount', async () => {
    let resolve!: (result: { sessions: typeof sessions }) => void;
    vi.mocked(apiGet).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
    const view = render(<ActiveSessions />);
    view.unmount();
    render(<ActiveSessions />);
    await screen.findByRole('button', { name: 'Revoke session one' });
    await act(async () => resolve({ sessions: [] }));
    expect(revokeButton()).toBeTruthy();
  });
});
