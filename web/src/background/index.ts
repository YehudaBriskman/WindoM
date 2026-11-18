/** Background service worker - closes duplicate new tabs and runs tab commands for content scripts */
import { isOwnExtensionSender, isTabId, parseTabCommand } from '../lib/runtime-messages';

/** The tab list earlier versions mirrored into storage on every tab event. */
const LEGACY_TABS_SNAPSHOT_KEY = '_windom_tabs';

// Earlier versions, on every tab event (each title, favicon and load-status change)
// queried all tabs, stored them, and sent every tab's URL and title to the
// content script on every open website. No content script read it - the tab
// sidebar is mounted only on the new tab page, which asks chrome.tabs itself -
// so it was browsing history handed to untrusted renderers for nothing. Drop
// the stored copy on update.
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove(LEGACY_TABS_SNAPSHOT_KEY).catch(() => {});
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Close any older WindoM newtab in the same window when a new one loads (#47).
  // Compared exactly: a website whose path merely contains "/newtab.html" must
  // not close the user's new tabs.
  const newtabUrl = chrome.runtime.getURL('newtab.html');
  if (changeInfo.status === 'loading' && tab.url?.split(/[?#]/)[0] === newtabUrl) {
    const tabs = await chrome.tabs.query({ windowId: tab.windowId });
    for (const other of tabs) {
      if (other.id && other.id !== tabId && other.url === newtabUrl) {
        chrome.tabs.remove(other.id).catch(() => {});
      }
    }
  }
});

// Handle tab-management commands forwarded from content scripts.
// Content scripts in MV3 cannot call chrome.tabs.* directly.
chrome.runtime.onMessage.addListener((payload: unknown, sender, sendResponse) => {
  if (!isOwnExtensionSender(sender)) return;
  const message = parseTabCommand(payload);
  if (!message) return;

  const tabId = sender.tab?.id;
  if (message.type !== 'WINDOM_CMD_NEW_TAB' && message.type !== 'WINDOM_CMD_OPEN_URL' && !isTabId(tabId)) return;

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
});
