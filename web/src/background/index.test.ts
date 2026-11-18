import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  respond: (value: unknown) => void,
) => boolean | undefined;
const addListener = vi.fn<(listener: Listener) => void>();
const tabs = {
  create: vi.fn(),
  remove: vi.fn(),
  duplicate: vi.fn(),
  get: vi.fn(),
  update: vi.fn(),
  query: vi.fn(),
  onActivated: { addListener: vi.fn() },
  onUpdated: { addListener: vi.fn() },
  onRemoved: { addListener: vi.fn() },
  onCreated: { addListener: vi.fn() },
};
let listener: Listener;
const onInstalled = vi.fn<(cb: () => void) => void>();
const storageRemove = vi.fn();
const ownSender = { id: 'windom', tab: { id: 0 } } as chrome.runtime.MessageSender;

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  for (const fn of [tabs.create, tabs.remove, tabs.duplicate, tabs.update]) fn.mockResolvedValue(undefined);
  storageRemove.mockResolvedValue(undefined);
  tabs.query = vi.fn();
  tabs.get.mockResolvedValue({ pinned: false });
  vi.stubGlobal('chrome', {
    runtime: {
      id: 'windom',
      getURL: (path: string) => `chrome-extension://windom/${path}`,
      onMessage: { addListener },
      onInstalled: { addListener: onInstalled },
    },
    storage: { local: { remove: storageRemove } },
    tabs,
  });
  await import('./index');
  listener = addListener.mock.calls[0][0];
});
afterEach(() => vi.unstubAllGlobals());

function expectNoTabCalls() {
  for (const fn of [tabs.create, tabs.remove, tabs.duplicate, tabs.get, tabs.update]) expect(fn).not.toHaveBeenCalled();
}

describe('background message boundary', () => {
  it.each([{}, { id: 'other-extension' }, { id: '' }])('rejects sender %j', (sender) => {
    expect(listener({ type: 'WINDOM_CMD_NEW_TAB' }, sender, vi.fn())).toBeUndefined();
    expectNoTabCalls();
  });

  it.each(
    [
      null,
      undefined,
      false,
      4,
      'WINDOM_CMD_NEW_TAB',
      [],
      {},
      { type: 1 },
      { type: 'UNKNOWN' },
      { type: 'WINDOM_CMD_OPEN_URL' },
      { type: 'WINDOM_CMD_OPEN_URL', url: 42 },
      { type: 'WINDOM_CMD_OPEN_URL', url: 'javascript:alert(1)' },
      { type: 'WINDOM_CMD_OPEN_URL', url: 'data:text/html,test' },
      { type: 'WINDOM_CMD_OPEN_URL', url: 'chrome://settings' },
    ].map((value) => [value]),
  )('rejects malformed or unsafe payload %j without throwing', (payload) => {
    expect(listener(payload, ownSender, vi.fn())).toBeUndefined();
    expectNoTabCalls();
  });

  it.each(['WINDOM_CMD_CLOSE_TAB', 'WINDOM_CMD_DUPLICATE_TAB', 'WINDOM_CMD_PIN_TAB'])(
    'requires a valid sender tab for %s',
    (type) => {
      for (const id of [undefined, -1, NaN, 1.5, '1']) {
        const sender = { id: 'windom', tab: { id } } as chrome.runtime.MessageSender;
        expect(listener({ type, tabId: 3 }, sender, vi.fn())).toBeUndefined();
      }
      expectNoTabCalls();
    },
  );

  it.each([
    ['WINDOM_CMD_CLOSE_TAB', tabs.remove],
    ['WINDOM_CMD_DUPLICATE_TAB', tabs.duplicate],
  ] as const)('%s targets only sender.tab, including tab zero', async (type, fn) => {
    const respond = vi.fn();
    expect(listener({ type, tabId: 999 }, ownSender, respond)).toBe(true);
    await waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true }));
    expect(fn).toHaveBeenCalledWith(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it.each([true, false])('toggles pinned state from %s', async (pinned) => {
    tabs.get.mockResolvedValue({ pinned });
    const respond = vi.fn();
    listener({ type: 'WINDOM_CMD_PIN_TAB' }, ownSender, respond);
    await waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true }));
    expect(tabs.get).toHaveBeenCalledWith(0);
    expect(tabs.update).toHaveBeenCalledWith(0, { pinned: !pinned });
  });

  it.each(['http://localhost:8080/', 'HTTPS://example.com/path?q=test#part'])(
    'opens a permitted destination %s',
    async (url) => {
      const respond = vi.fn();
      listener({ type: 'WINDOM_CMD_OPEN_URL', url }, { id: 'windom' }, respond);
      await waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true }));
      expect(tabs.create).toHaveBeenCalledWith({ url });
    },
  );

  it('creates a blank tab without forwarding extra payload properties', async () => {
    const respond = vi.fn();
    listener({ type: 'WINDOM_CMD_NEW_TAB', url: 'javascript:alert(1)' }, ownSender, respond);
    await waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true }));
    expect(tabs.create).toHaveBeenCalledWith({});
  });

  it('reports Chrome API failure without exposing internal error text', async () => {
    tabs.remove.mockRejectedValue(new Error('tab closed'));
    const respond = vi.fn();
    listener({ type: 'WINDOM_CMD_CLOSE_TAB' }, ownSender, respond);
    await waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: false }));
    expect(respond).toHaveBeenCalledTimes(1);
  });
});

describe('tab events', () => {
  type OnUpdated = (
    tabId: number,
    changeInfo: { status?: string },
    tab: { url?: string; windowId: number },
  ) => Promise<void>;
  const onUpdated = () => tabs.onUpdated.addListener.mock.calls[0][0] as OnUpdated;
  const NEWTAB = 'chrome-extension://windom/newtab.html';

  it('no longer broadcasts the tab list on tab events', () => {
    for (const event of [tabs.onActivated, tabs.onRemoved, tabs.onCreated]) {
      expect(event.addListener).not.toHaveBeenCalled();
    }
  });

  it('drops the tab snapshot earlier versions stored', () => {
    onInstalled.mock.calls[0][0]();
    expect(storageRemove).toHaveBeenCalledWith('_windom_tabs');
  });

  it('closes an older WindoM new tab when a new one loads', async () => {
    tabs.query.mockResolvedValue([
      { id: 1, url: NEWTAB },
      { id: 2, url: NEWTAB },
      { id: 3, url: 'https://example.com/' },
    ]);
    await onUpdated()(2, { status: 'loading' }, { url: NEWTAB, windowId: 0 });
    expect(tabs.remove).toHaveBeenCalledTimes(1);
    expect(tabs.remove).toHaveBeenCalledWith(1);
  });

  it('ignores a website whose path contains newtab.html', async () => {
    await onUpdated()(5, { status: 'loading' }, { url: 'https://example.com/newtab.html', windowId: 0 });
    expect(tabs.query).not.toHaveBeenCalled();
    expect(tabs.remove).not.toHaveBeenCalled();
  });
});
