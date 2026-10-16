import { isValidUrl } from '../utils/url';

export type TabCommand =
  | { type: 'WINDOM_CMD_NEW_TAB' | 'WINDOM_CMD_CLOSE_TAB' | 'WINDOM_CMD_DUPLICATE_TAB' | 'WINDOM_CMD_PIN_TAB' }
  | { type: 'WINDOM_CMD_OPEN_URL'; url: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isOwnExtensionSender(sender: chrome.runtime.MessageSender): boolean {
  return typeof chrome.runtime.id === 'string' && chrome.runtime.id.length > 0
    && sender.id === chrome.runtime.id;
}

/** Reconstruct commands so untrusted payload fields never select target tabs. */
export function parseTabCommand(value: unknown): TabCommand | null {
  if (!isRecord(value)) return null;
  switch (value.type) {
    case 'WINDOM_CMD_NEW_TAB':
    case 'WINDOM_CMD_CLOSE_TAB':
    case 'WINDOM_CMD_DUPLICATE_TAB':
    case 'WINDOM_CMD_PIN_TAB':
      return { type: value.type };
    case 'WINDOM_CMD_OPEN_URL':
      return typeof value.url === 'string' && isValidUrl(value.url)
        ? { type: value.type, url: value.url } : null;
    default:
      return null;
  }
}

export type TabSnapshot = Pick<chrome.tabs.Tab, 'id' | 'windowId' | 'active' | 'title' | 'url' | 'favIconUrl'>;

export function isTabId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Validate only fields consumed by the sidebar, including persisted snapshots. */
export function isTabSnapshotList(value: unknown): value is TabSnapshot[] {
  return Array.isArray(value) && value.every((tab: unknown) =>
    isRecord(tab) && isTabId(tab.id) && isTabId(tab.windowId) && typeof tab.active === 'boolean'
    && ['title', 'url', 'favIconUrl'].every((key) => tab[key] === undefined || typeof tab[key] === 'string'),
  );
}

export function parseTabsChanged(value: unknown): TabSnapshot[] | null {
  return isRecord(value) && value.type === 'WINDOM_TABS_CHANGED' && isTabSnapshotList(value.tabs)
    ? value.tabs : null;
}
