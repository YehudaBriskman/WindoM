import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchOverlay } from './SearchOverlay';

const update = vi.fn();
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { general: { searchEngine: 'google' } }, update }),
}));
vi.mock('../../lib/history-permission', () => ({
  hasHistoryApi: () => false,
  hasHistoryPermission: async () => false,
  searchHistory: async () => [],
}));

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  update.mockReset();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function openOverlay() {
  render(<SearchOverlay />);
  act(() => {
    fireEvent.keyDown(document, { key: 'h', ctrlKey: true, metaKey: true });
  });
  return screen.getByRole('dialog', { name: 'Search' });
}

describe('SearchOverlay keyboard access', () => {
  it('lets Tab move past the input instead of pinning focus to it', () => {
    const dialog = openOverlay();
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'query' } });
    const pill = screen.getByRole('button', { name: 'Choose search engine' });
    pill.focus();
    // Mid-dialog: the browser's own Tab order applies (fireEvent returns
    // false when the handler called preventDefault). The old handler sent
    // every Tab back to the input.
    expect(fireEvent.keyDown(pill, { key: 'Tab' })).toBe(true);
    expect(document.activeElement).toBe(pill);
    // From the last control, Tab wraps to the first rather than leaving.
    const controls = dialog.querySelectorAll<HTMLElement>('input, button');
    const last = controls[controls.length - 1];
    last.focus();
    expect(fireEvent.keyDown(last, { key: 'Tab' })).toBe(false);
    expect(document.activeElement).toBe(input);
  });

  it('chooses an engine with a click event, which Enter and Space produce', () => {
    openOverlay();
    fireEvent.click(screen.getByRole('button', { name: 'Choose search engine' }));
    const bing = screen.getByRole('button', { name: 'Bing' });
    expect(screen.getByRole('button', { name: 'Google' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(bing);
    expect(update).toHaveBeenCalledWith('general', { searchEngine: 'bing' });
  });

  it('closes the engine picker on Escape before closing the overlay', () => {
    openOverlay();
    const pill = screen.getByRole('button', { name: 'Choose search engine' });
    fireEvent.click(pill);
    fireEvent.keyDown(screen.getByRole('button', { name: 'Bing' }), { key: 'Escape' });
    expect(screen.queryByRole('button', { name: 'Bing' })).toBeNull();
    expect(document.activeElement).toBe(pill);
    expect(screen.getByRole('dialog', { name: 'Search' })).toBeTruthy();
  });
});
