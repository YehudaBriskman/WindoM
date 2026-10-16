import { waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Listener = (message: unknown, sender: chrome.runtime.MessageSender, respond: (value: unknown) => void) => boolean | undefined;
const addListener = vi.fn<(listener: Listener) => void>();
const tabs = {
  create: vi.fn(), remove: vi.fn(), duplicate: vi.fn(), get: vi.fn(), update: vi.fn(),
  onActivated: { addListener: vi.fn() }, onUpdated: { addListener: vi.fn() },
  onRemoved: { addListener: vi.fn() }, onCreated: { addListener: vi.fn() },
};
let listener: Listener;
const ownSender = { id: 'windom', tab: { id: 0 } } as chrome.runtime.MessageSender;

beforeEach(async () => {
  vi.resetAllMocks();
  vi.resetModules();
  for (const fn of [tabs.create, tabs.remove, tabs.duplicate, tabs.update]) fn.mockResolvedValue(undefined);
  tabs.get.mockResolvedValue({ pinned: false });
  vi.stubGlobal('chrome', { runtime: { id: 'windom', onMessage: { addListener }, onSuspend: { addListener: vi.fn() } }, tabs });
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

  it.each([null, undefined, false, 4, 'WINDOM_CMD_NEW_TAB', [], {}, { type: 1 }, { type: 'UNKNOWN' },
    { type: 'WINDOM_CMD_OPEN_URL' }, { type: 'WINDOM_CMD_OPEN_URL', url: 42 },
    { type: 'WINDOM_CMD_OPEN_URL', url: 'javascript:alert(1)' },
    { type: 'WINDOM_CMD_OPEN_URL', url: 'data:text/html,test' },
    { type: 'WINDOM_CMD_OPEN_URL', url: 'chrome://settings' },
  ].map((value) => [value]))('rejects malformed or unsafe payload %j without throwing', (payload) => {
    expect(listener(payload, ownSender, vi.fn())).toBeUndefined();
    expectNoTabCalls();
  });

  it.each(['WINDOM_CMD_CLOSE_TAB', 'WINDOM_CMD_DUPLICATE_TAB', 'WINDOM_CMD_PIN_TAB'])(
    'requires a valid sender tab for %s', (type) => {
      for (const id of [undefined, -1, NaN, 1.5, '1']) {
        const sender = { id: 'windom', tab: { id } } as chrome.runtime.MessageSender;
        expect(listener({ type, tabId: 3 }, sender, vi.fn())).toBeUndefined();
      }
      expectNoTabCalls();
    },
  );

  it.each([
    ['WINDOM_CMD_CLOSE_TAB', tabs.remove], ['WINDOM_CMD_DUPLICATE_TAB', tabs.duplicate],
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
    'opens a permitted destination %s', async (url) => {
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
