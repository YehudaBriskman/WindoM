import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TabSidebar } from './TabSidebar';

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { general: { sidebarSide: 'left' } } }),
}));

// The sidebar is mounted only on the new tab page, an extension page.
vi.mock('../../lib/chrome-runtime', () => ({
  hasChromeApi: true,
  isContentScript: false,
}));

const query = vi.fn();
const addListener = vi.fn();
const listenerApi = { addListener, removeListener: vi.fn() };
const onMessage = { addListener: vi.fn(), removeListener: vi.fn() };
const tab = { id: 1, windowId: 0, active: true, title: 'Example tab', url: 'https://example.com' };

beforeEach(() => {
  vi.resetAllMocks();
  query.mockResolvedValue([tab]);
  vi.stubGlobal('chrome', {
    runtime: { id: 'windom', onMessage },
    tabs: { query, onActivated: listenerApi, onUpdated: listenerApi, onRemoved: listenerApi },
  });
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('TabSidebar', () => {
  it('lists tabs from chrome.tabs and follows tab events', async () => {
    render(<TabSidebar />);
    await waitFor(() => expect(screen.getByText('Example tab')).toBeTruthy());
    expect(addListener).toHaveBeenCalledTimes(3);
  });

  // The tab list used to arrive as a runtime message broadcast to every
  // website's content script. Nothing should be listening for one now.
  it('does not listen for runtime messages', async () => {
    render(<TabSidebar />);
    await waitFor(() => expect(query).toHaveBeenCalled());
    expect(onMessage.addListener).not.toHaveBeenCalled();
  });
});
