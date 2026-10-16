import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TabSidebar } from './TabSidebar';

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { general: { sidebarSide: 'left' } } }),
}));

type Listener = (message: unknown, sender: chrome.runtime.MessageSender) => void;
const addListener = vi.fn<(listener: Listener) => void>();
const removeListener = vi.fn();
const get = vi.fn();
const tab = { id: 1, windowId: 0, active: true, title: 'Example tab', url: 'https://example.com' };
function send(message: unknown, sender: chrome.runtime.MessageSender = { id: 'windom' }) {
  act(() => addListener.mock.calls[0][0](message, sender));
}

beforeEach(() => {
  vi.resetAllMocks();
  get.mockResolvedValue({});
  vi.stubGlobal('chrome', {
    runtime: { id: 'windom', onMessage: { addListener, removeListener } },
    storage: { local: { get } },
  });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('TabSidebar message boundary', () => {
  it('renders validated stored snapshots and accepts live updates', async () => {
    get.mockResolvedValue({ _windom_tabs: [tab] });
    const view = render(<TabSidebar />);
    expect(await screen.findByText('Example tab')).toBeTruthy();
    send({ type: 'WINDOM_TABS_CHANGED', tabs: [] });
    expect(screen.queryByText('Example tab')).toBeNull();
    view.unmount();
    expect(removeListener).toHaveBeenCalledWith(addListener.mock.calls[0][0]);
  });

  it.each([{}, { id: 'another-extension' }])('ignores updates from sender %j', (sender) => {
    render(<TabSidebar />);
    send({ type: 'WINDOM_TABS_CHANGED', tabs: [tab] }, sender);
    expect(screen.queryByText('Example tab')).toBeNull();
  });

  it.each([null, false, {}, [], { type: 'OTHER', tabs: [tab] },
    { type: 'WINDOM_TABS_CHANGED', tabs: {} },
    ...[null, {}, { ...tab, id: -1 }, { ...tab, id: 1.5 }, { ...tab, windowId: '0' },
      { ...tab, active: 'true' }, { ...tab, title: {} }, { ...tab, url: 42 }, { ...tab, favIconUrl: [] }]
      .map((invalid) => ({ type: 'WINDOM_TABS_CHANGED', tabs: [invalid] })),
  ].map((value) => [value]))('ignores malformed messages %j', (message) => {
    render(<TabSidebar />);
    send(message);
    expect(screen.queryByText('Example tab')).toBeNull();
  });

  it.each([{}, [null], [{ ...tab, url: {} }]].map((value) => [value]))('ignores corrupted stored snapshots %j', async (stored) => {
    get.mockResolvedValue({ _windom_tabs: stored });
    render(<TabSidebar />);
    await act(async () => {});
    expect(screen.queryByText('Example tab')).toBeNull();
  });

  it('does not overwrite a live update with a slower storage snapshot', async () => {
    let resolve!: (result: unknown) => void;
    get.mockReturnValue(new Promise((done) => { resolve = done; }));
    render(<TabSidebar />);
    send({ type: 'WINDOM_TABS_CHANGED', tabs: [tab] });
    await act(async () => resolve({ _windom_tabs: [] }));
    expect(screen.getByText('Example tab')).toBeTruthy();
  });

  it('continues accepting live updates after a storage read failure', async () => {
    get.mockRejectedValue(new Error('storage unavailable'));
    render(<TabSidebar />);
    await waitFor(() => expect(get).toHaveBeenCalled());
    send({ type: 'WINDOM_TABS_CHANGED', tabs: [tab] });
    expect(screen.getByText('Example tab')).toBeTruthy();
  });
});
