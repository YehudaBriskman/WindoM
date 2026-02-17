/** Typed wrappers for chrome.storage.sync and chrome.storage.local */

export const syncStorage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const result = await chrome.storage.sync.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting storage key "${key}":`, error);
      return defaultValue;
    }
  },

  async set(key: string, value: unknown): Promise<boolean> {
    try {
      await chrome.storage.sync.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Error setting storage key "${key}":`, error);
      return false;
    }
  },

  async getMultiple<T extends Record<string, unknown>>(keys: T): Promise<T> {
    try {
      const keyNames = Object.keys(keys);
      const result = await chrome.storage.sync.get(keyNames);
      const merged = { ...keys };
      for (const key of keyNames) {
        if (result[key] !== undefined) {
          (merged as Record<string, unknown>)[key] = result[key];
        }
      }
      return merged;
    } catch (error) {
      console.error('Error getting multiple storage keys:', error);
      return keys;
    }
  },

  async setMultiple(values: Record<string, unknown>): Promise<boolean> {
    try {
      await chrome.storage.sync.set(values);
      return true;
    } catch (error) {
      console.error('Error setting multiple storage values:', error);
      return false;
    }
  },

  async remove(key: string): Promise<boolean> {
    try {
      await chrome.storage.sync.remove(key);
      return true;
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await chrome.storage.sync.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  },

  onChange(callback: (changes: { [key: string]: chrome.storage.StorageChange }) => void) {
    const listener = (changes: { [key: string]: chrome.storage.StorageChange }, areaName: string) => {
      if (areaName === 'sync') {
        callback(changes);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};

export const localStorage = {
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      const result = await chrome.storage.local.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting local storage key "${key}":`, error);
      return defaultValue;
    }
  },

  async set(key: string, value: unknown): Promise<boolean> {
    try {
      await chrome.storage.local.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Error setting local storage key "${key}":`, error);
      return false;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await chrome.storage.local.clear();
      return true;
    } catch (error) {
      console.error('Error clearing local storage:', error);
      return false;
    }
  },
};
