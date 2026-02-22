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
