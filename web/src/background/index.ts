/** Background service worker — manages tab state and broadcasts to content scripts */

async function broadcastTabsChanged() {
  const tabs = await chrome.tabs.query({});
  await chrome.storage.local.set({ _windom_tabs: tabs });

  for (const tab of tabs) {
    if (tab.id == null) continue;
    chrome.tabs.sendMessage(tab.id, { type: 'WINDOM_TABS_CHANGED', tabs }).catch(() => {});
  }
}

chrome.tabs.onActivated.addListener(() => broadcastTabsChanged());
chrome.tabs.onUpdated.addListener(() => broadcastTabsChanged());
chrome.tabs.onRemoved.addListener(() => broadcastTabsChanged());
chrome.tabs.onCreated.addListener(() => broadcastTabsChanged());

// Handle tab-management commands forwarded from content scripts.
// Content scripts in MV3 cannot call chrome.tabs.* directly.
type CmdMessage =
  | { type: 'WINDOM_CMD_NEW_TAB' }
  | { type: 'WINDOM_CMD_CLOSE_TAB' }
  | { type: 'WINDOM_CMD_DUPLICATE_TAB' }
  | { type: 'WINDOM_CMD_PIN_TAB' }
  | { type: 'WINDOM_CMD_OPEN_URL'; url: string };

chrome.runtime.onMessage.addListener(
  (message: CmdMessage, sender, sendResponse) => {
    const tabId = sender.tab?.id;

    const handle = async () => {
      switch (message.type) {
        case 'WINDOM_CMD_NEW_TAB':
          await chrome.tabs.create({});
          break;
        case 'WINDOM_CMD_CLOSE_TAB':
          if (tabId) await chrome.tabs.remove(tabId);
          break;
        case 'WINDOM_CMD_DUPLICATE_TAB':
          if (tabId) await chrome.tabs.duplicate(tabId);
          break;
        case 'WINDOM_CMD_PIN_TAB':
          if (tabId) {
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
