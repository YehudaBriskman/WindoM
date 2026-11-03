import { useState, useEffect, useRef, useCallback } from 'react';
import { Plus } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import { isOwnExtensionSender, isTabSnapshotList, parseTabsChanged, type TabSnapshot } from '../../lib/runtime-messages';
import { useLiquidGlass } from '../../hooks/useLiquidGlass';
import { hasChromeApi, isContentScript, onRuntimeMessage } from '../../lib/chrome-runtime';
import { canQueryTabs, createTab, focusTab, onTabsChanged, queryTabs, readTabsSnapshot } from '../../lib/chrome-tabs';

interface TabEntry {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  active: boolean;
  windowId: number;
}


export function TabSidebar() {
  const glassRef = useLiquidGlass<HTMLDivElement>('sidebar');
  const { settings } = useSettings();
  const [tabs, setTabs] = useState<TabEntry[]>([]);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const side = settings.general.sidebarSide;

  const normalizeTabs = useCallback((chromeTabs: TabSnapshot[]) => {
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
    if (!canQueryTabs()) return;
    try {
      const chromeTabs = await queryTabs();
      setTabs(normalizeTabs(chromeTabs));
    } catch { /* ignore */ }
  }, [normalizeTabs]);

  // Extension page mode (newtab): query tabs and listen to tab events directly
  useEffect(() => {
    if (isContentScript) return;
    loadTabs();
    if (!hasChromeApi) return;
    return onTabsChanged(() => loadTabs());
  }, [loadTabs]);

  // Content script mode: read from storage and listen for messages from background
  useEffect(() => {
    if (!isContentScript || !hasChromeApi) return;
    let active = true;
    let receivedUpdate = false;

    // Initial load from storage snapshot set by background worker
    readTabsSnapshot().then((stored) => {
      if (active && !receivedUpdate && isTabSnapshotList(stored)) setTabs(normalizeTabs(stored));
    }).catch(() => {});

    // Live updates via message from background service worker
    const onMessage = (message: unknown, sender: chrome.runtime.MessageSender) => {
      if (!isOwnExtensionSender(sender)) return;
      const updated = parseTabsChanged(message);
      if (!updated) return;
      receivedUpdate = true;
      setTabs(normalizeTabs(updated));
    };
    const unsubscribe = onRuntimeMessage(onMessage);
    return () => {
      active = false;
      unsubscribe();
    };
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
    focusTab(tab.id, tab.windowId);
    setVisible(false);
  };

  const handleNewTab = () => {
    if (!hasChromeApi) return;
    createTab();
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
        ref={glassRef}
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
                <img src={tab.favIconUrl} className="tab-sidebar-favicon" alt="" loading="lazy" />
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
