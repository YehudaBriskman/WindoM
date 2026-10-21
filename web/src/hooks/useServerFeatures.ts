import { useSyncExternalStore } from 'react';
import { getGmailAvailable, subscribeServerFeatures } from '../lib/server-features';

/** Whether this server offers the Gmail widget at all. See server-features.ts. */
export function useGmailAvailable(): boolean {
  return useSyncExternalStore(subscribeServerFeatures, getGmailAvailable, getGmailAvailable);
}
