import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface TabEntry {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  windowId: number;
}

const hasChromeApi = typeof chrome !== 'undefined';
const isContentScript = window.location.protocol !== 'chrome-extension:';

export function TabSidebar() {
  const { settings } = useSettings();
  const [tabs, setTabs] = useState<TabEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const side = settings.tabSidebarSide ?? 'right';

  const normalizeTabs = useCallback((chromeTabs: chrome.tabs.Tab[]) => {
    return chromeTabs
      .filter(t => !t.url?.startsWith('chrome://') && !t.url?.startsWith('chrome-extension://'))
      .map(t => ({
        id: t.id ?? 0,
        title: t.title ?? t.url ?? '',
        url: t.url ?? '',
        favIconUrl: t.favIconUrl || undefined,
        active: t.active ?? false,
        windowId: t.windowId ?? 0,
      }));
  }, []);

  const loadTabs = useCallback(async () => {
    if (!hasChromeApi || !chrome.tabs?.query) return;
    try {
      const chromeTabs = await chrome.tabs.query({});
      setTabs(normalizeTabs(chromeTabs));
    } catch { /* ignore */ }
  }, [normalizeTabs]);

  // Extension page mode (newtab): query tabs and listen to tab events directly
  useEffect(() => {
    if (isContentScript) return;
    loadTabs();
    if (!hasChromeApi) return;

    const onActivated = () => loadTabs();
    const onUpdated = () => loadTabs();
    const onRemoved = () => loadTabs();

    chrome.tabs.onActivated?.addListener(onActivated);
    chrome.tabs.onUpdated?.addListener(onUpdated);
    chrome.tabs.onRemoved?.addListener(onRemoved);

    return () => {
      chrome.tabs.onActivated?.removeListener(onActivated);
      chrome.tabs.onUpdated?.removeListener(onUpdated);
      chrome.tabs.onRemoved?.removeListener(onRemoved);
    };
  }, [loadTabs]);

  // Content script mode: read from storage and listen for messages from background
  useEffect(() => {
    if (!isContentScript || !hasChromeApi) return;

    // Initial load from storage snapshot set by background worker
    chrome.storage.local.get('_windom_tabs').then((result) => {
      const stored = result['_windom_tabs'] as chrome.tabs.Tab[] | undefined;
      if (stored) setTabs(normalizeTabs(stored));
    }).catch(() => {});

    // Live updates via message from background service worker
    const onMessage = (message: { type: string; tabs?: chrome.tabs.Tab[] }) => {
      if (message.type === 'WINDOM_TABS_CHANGED' && message.tabs) {
        setTabs(normalizeTabs(message.tabs));
      }
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [normalizeTabs]);

  const showSidebar = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setVisible(true);
  };

  const hideSidebar = () => {
    hideTimerRef.current = setTimeout(() => setVisible(false), 300);
  };

  const handleTabClick = (tab: TabEntry) => {
    if (!hasChromeApi) return;
    chrome.tabs.update(tab.id, { active: true });
    chrome.windows.update(tab.windowId, { focused: true });
    setVisible(false);
  };

  const handleNewTab = () => {
    if (!hasChromeApi) return;
    chrome.tabs.create({});
    setVisible(false);
  };

  return (
    <>
      {/* 15px hover trigger zone at screen edge */}
      <div
        className={`tab-sidebar-trigger tab-sidebar-trigger-${side}`}
        onMouseEnter={showSidebar}
        onMouseLeave={hideSidebar}
      />

      {/* Thin edge indicator badge (visible when sidebar is hidden) */}
      {!visible && (
        <div className={`tab-sidebar-edge tab-sidebar-edge-${side}`} />
      )}

      {/* Sidebar panel */}
      <div
        className={`tab-sidebar-panel tab-sidebar-panel-${side}${visible ? ' visible' : ''} glass-sidebar`}
        onMouseEnter={showSidebar}
        onMouseLeave={hideSidebar}
      >
        <button className="tab-sidebar-new-tab" onClick={handleNewTab} type="button">
          <Plus size={14} strokeWidth={2} />
          New Tab
        </button>
        <div className="tab-sidebar-list">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-sidebar-item${tab.active ? ' active' : ''}`}
              onClick={() => handleTabClick(tab)}
              type="button"
              title={tab.title}
            >
              {tab.favIconUrl ? (
                <img src={tab.favIconUrl} className="tab-sidebar-favicon" alt="" />
              ) : (
                <div className="tab-sidebar-favicon-placeholder" />
              )}
              <span className="tab-sidebar-title">{tab.title}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
