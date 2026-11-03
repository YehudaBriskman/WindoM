import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusInput } from './FocusInput';

// The real useFocus runs on top of this mock, so the save result travels the
// same path as in the app: update() -> useFocus.setText -> useSaveStatus.
const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: { widgets: { showFocus: true }, focus: { mainFocus: '', completed: false } },
    update,
  }),
}));
beforeEach(() => vi.clearAllMocks());

async function typeAndCommit(value: string) {
  const input = screen.getByPlaceholderText('Your main focus...');
  fireEvent.change(input, { target: { value } });
  await act(async () => fireEvent.blur(input));
}

describe('FocusInput save feedback', () => {
  it('says "Saved" when every write succeeds', async () => {
    update.mockResolvedValue(true);
    render(<FocusInput />);
    await typeAndCommit('Write the report');
    expect(update).toHaveBeenCalledWith('focus', { mainFocus: 'Write the report' });
    expect(screen.getByRole('status').textContent).toBe('Saved');
  });

  // #437: a failed chrome.storage write resolves false rather than throwing.
  it('says it could not save when the focus write resolves false', async () => {
    update.mockResolvedValueOnce(false).mockResolvedValue(true);
    render(<FocusInput />);
    await typeAndCommit('Write the report');
    expect(screen.getByRole('status').textContent).toBe('Couldn’t save. Try again.');
  });

  it('says it could not save when only the completed reset fails', async () => {
    update.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    render(<FocusInput />);
    await typeAndCommit('Write the report');
    expect(screen.getByRole('status').textContent).toBe('Couldn’t save. Try again.');
  });
});
