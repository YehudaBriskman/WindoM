import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => cleanup());

// ── Chrome API global stub ─────────────────────────────────────────────────
// Provides chrome.storage.sync / local / onChanged used directly in
// SettingsContext (chrome.storage.sync.get(null)) and indirectly through
// the chrome-storage.ts wrappers.

const chromeMock = {
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn().mockResolvedValue(undefined),
    },
    local: {
      get: vi.fn().mockResolvedValue({}),
      set: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    },
    onChanged: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
};

// @ts-expect-error - chrome is not defined in jsdom
globalThis.chrome = chromeMock;

beforeEach(() => {
  vi.clearAllMocks();
  // Restore default implementations after clearAllMocks resets call history
  chromeMock.storage.sync.get.mockResolvedValue({});
  chromeMock.storage.sync.set.mockResolvedValue(undefined);
  chromeMock.storage.sync.clear.mockResolvedValue(undefined);
  chromeMock.storage.sync.remove.mockResolvedValue(undefined);
  chromeMock.storage.local.get.mockResolvedValue({});
  chromeMock.storage.local.set.mockResolvedValue(undefined);
  chromeMock.storage.local.clear.mockResolvedValue(undefined);
});
