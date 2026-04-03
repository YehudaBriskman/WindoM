// WindoM Background Service Worker
// Receives tab-manipulation commands from the search overlay iframe and executes
// them with chrome.tabs (which is unavailable in content script context).

chrome.runtime.onMessage.addListener((msg: { type: string; url?: string }, sender) => {
  const tabId = sender.tab?.id;

  switch (msg.type) {
    case 'WINDOM_CMD_NEW_TAB':
      chrome.tabs.create({});
      break;

    case 'WINDOM_CMD_CLOSE_TAB':
      if (tabId != null) chrome.tabs.remove(tabId);
      break;

    case 'WINDOM_CMD_DUPLICATE_TAB':
      if (tabId != null) chrome.tabs.duplicate(tabId);
      break;

    case 'WINDOM_CMD_PIN_TAB':
      if (tabId != null) {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) return;
          chrome.tabs.update(tabId, { pinned: !tab.pinned });
        });
      }
      break;

    case 'WINDOM_CMD_OPEN_URL':
      if (msg.url) chrome.tabs.create({ url: msg.url });
      break;
  }

  return false;
});
