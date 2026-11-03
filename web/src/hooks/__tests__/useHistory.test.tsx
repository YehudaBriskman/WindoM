import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HistoryAppSettings } from '../../components/settings/sections/HistoryAppSettings';
import { HistorySection } from '../../components/sidebar/HistorySection';

// `history` is an optional permission (#256). These tests pin the contract:
// chrome.history is never called without the permission, the toggle requests
// it from the change handler, denial leaves the feature off, turning it off
// gives the permission back, and a revocation is picked up live.

const update = vi.fn().mockResolvedValue(undefined);
let showHistory = false;
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { general: { showHistory } }, update }),
}));

type Listener = (p: chrome.permissions.Permissions) => void;
let granted = false;
let removedListeners: Listener[] = [];

const permissions = {
  contains: vi.fn(async () => granted),
  request: vi.fn(async () => granted),
  remove: vi.fn(async () => { granted = false; return true; }),
  onAdded: { addListener: vi.fn(), removeListener: vi.fn() },
  onRemoved: {
    addListener: vi.fn((l: Listener) => { removedListeners.push(l); }),
    removeListener: vi.fn((l: Listener) => { removedListeners = removedListeners.filter((x) => x !== l); }),
  },
};
const history = {
  search: vi.fn((_q: unknown, cb: (r: chrome.history.HistoryItem[]) => void) => {
    cb([{ id: '1', url: 'https://example.com/a', title: 'Example', lastVisitTime: Date.now() }]);
  }),
};

const g = globalThis as unknown as { chrome: Record<string, unknown> };
g.chrome.permissions = permissions;
g.chrome.history = history;

beforeEach(() => {
  update.mockClear();
  Object.values(permissions).forEach((f) => { if (typeof f === 'function') f.mockClear(); });
  history.search.mockClear();
  granted = false;
  showHistory = false;
  removedListeners = [];
});

const toggle = () => screen.getByRole('checkbox') as HTMLInputElement;

describe('HistoryAppSettings', () => {
  it('requests the permission when turned on, then enables the feature', async () => {
    render(<HistoryAppSettings />);
    await waitFor(() => expect(toggle().disabled).toBe(false));
    expect(toggle().checked).toBe(false);

    granted = true; // the user clicks Allow
    fireEvent.click(toggle());
    await waitFor(() => expect(update).toHaveBeenCalledWith('general', { showHistory: true }));
    expect(permissions.request).toHaveBeenCalledWith({ permissions: ['history'] });
  });

  it('leaves the feature off and says so when the user denies', async () => {
    render(<HistoryAppSettings />);
    await waitFor(() => expect(toggle().disabled).toBe(false));

    fireEvent.click(toggle()); // request resolves false
    expect((await screen.findByRole('alert')).textContent).toContain('did not grant');
    expect(update).not.toHaveBeenCalled();
    expect(toggle().checked).toBe(false);
  });

  it('turning it off clears the setting and gives the permission back', async () => {
    showHistory = true;
    granted = true;
    render(<HistoryAppSettings />);
    await waitFor(() => expect(toggle().checked).toBe(true));

    fireEvent.click(toggle());
    await waitFor(() => expect(permissions.remove).toHaveBeenCalledWith({ permissions: ['history'] }));
    expect(update).toHaveBeenCalledWith('general', { showHistory: false });
  });

  it('shows off, with a note, when the setting is on but the permission is missing', async () => {
    showHistory = true; // e.g. synced from another device
    render(<HistoryAppSettings />);
    expect((await screen.findByRole('status')).textContent).toContain('removed');
    expect(toggle().checked).toBe(false);
  });
});

describe('HistorySection', () => {
  it('never calls chrome.history without the permission and offers to allow it', async () => {
    showHistory = true;
    render(<HistorySection />);
    await screen.findByRole('button', { name: 'Allow access' });
    expect(history.search).not.toHaveBeenCalled();

    granted = true;
    fireEvent.click(screen.getByRole('button', { name: 'Allow access' }));
    expect(await screen.findByText('Example')).toBeTruthy();
    expect(history.search).toHaveBeenCalledTimes(1);
  });

  it('drops the list when the permission is revoked', async () => {
    showHistory = true;
    granted = true;
    render(<HistorySection />);
    await screen.findByText('Example');

    granted = false;
    act(() => removedListeners.forEach((l) => l({ permissions: ['history'] })));
    await screen.findByRole('button', { name: 'Allow access' });
    expect(screen.queryByText('Example')).toBeNull();
  });

  it('renders nothing and reads nothing when the feature is off', async () => {
    granted = true;
    const { container } = render(<HistorySection />);
    await waitFor(() => expect(permissions.contains).toHaveBeenCalled());
    expect(container.innerHTML).toBe('');
    expect(history.search).not.toHaveBeenCalled();
  });
});
