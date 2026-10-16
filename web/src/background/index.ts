/** Background service worker - manages tab state and broadcasts to content scripts */
import { isOwnExtensionSender, isTabId, parseTabCommand } from '../lib/runtime-messages';

let suspended = false;
chrome.runtime.onSuspend.addListener(() => { suspended = true; });

async function broadcastTabsChanged() {
  if (suspended) return;
  const tabs = await chrome.tabs.query({});
  await chrome.storage.local.set({ _windom_tabs: tabs });

  for (const tab of tabs) {
    if (tab.id === null || tab.id === undefined) continue;
    chrome.tabs.sendMessage(tab.id, { type: 'WINDOM_TABS_CHANGED', tabs }).catch(() => {});
  }
}

chrome.tabs.onActivated.addListener(() => broadcastTabsChanged());
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Close any older WindoM newtab in the same window when a new one loads (#47)
  if (changeInfo.status === 'loading' && tab.url?.includes('/newtab.html')) {
    const newtabUrl = `chrome-extension://${chrome.runtime.id}/newtab.html`;
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    for (const other of tabs) {
      if (other.id && other.id !== tabId && other.url === newtabUrl) {
        chrome.tabs.remove(other.id).catch(() => {});
      }
    }
  }
  broadcastTabsChanged();
});
chrome.tabs.onRemoved.addListener(() => broadcastTabsChanged());
chrome.tabs.onCreated.addListener(() => broadcastTabsChanged());

// Handle tab-management commands forwarded from content scripts.
// Content scripts in MV3 cannot call chrome.tabs.* directly.
chrome.runtime.onMessage.addListener(
  (payload: unknown, sender, sendResponse) => {
    if (!isOwnExtensionSender(sender)) return;
    const message = parseTabCommand(payload);
    if (!message) return;

    const tabId = sender.tab?.id;
    if (message.type !== 'WINDOM_CMD_NEW_TAB' && message.type !== 'WINDOM_CMD_OPEN_URL'
      && !isTabId(tabId)) return;

    const handle = async () => {
      switch (message.type) {
        case 'WINDOM_CMD_NEW_TAB':
          await chrome.tabs.create({});
          break;
        case 'WINDOM_CMD_CLOSE_TAB':
          if (isTabId(tabId)) await chrome.tabs.remove(tabId);
          break;
        case 'WINDOM_CMD_DUPLICATE_TAB':
          if (isTabId(tabId)) await chrome.tabs.duplicate(tabId);
          break;
        case 'WINDOM_CMD_PIN_TAB':
          if (isTabId(tabId)) {
            const tab = await chrome.tabs.get(tabId);
            await chrome.tabs.update(tabId, { pinned: !tab.pinned });
          }
          break;
        case 'WINDOM_CMD_OPEN_URL':
          await chrome.tabs.create({ url: message.url });
          break;
        default:
          return; // not our message
      }
      sendResponse({ ok: true });
    };

    handle().catch(() => sendResponse({ ok: false }));
    return true; // keep channel open for async response
  },
);
