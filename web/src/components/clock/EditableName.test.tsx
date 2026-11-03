import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditableName } from './EditableName';

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { general: { userName: 'Ada' } }, update }),
}));
beforeEach(() => vi.clearAllMocks());

describe('EditableName', () => {
  it('is exposed as a named single-line textbox', () => {
    render(<EditableName />);
    const field = screen.getByRole('textbox', { name: 'Your name' });
    expect(field.getAttribute('contenteditable')).toBe('true');
    expect(field.getAttribute('aria-multiline')).toBe('false');
  });

  it('Escape discards the edit and does not save', () => {
    render(<EditableName />);
    const field = screen.getByRole('textbox', { name: 'Your name' });
    field.focus();
    field.textContent = 'Grace';
    fireEvent.keyDown(field, { key: 'Escape' });
    expect(field.textContent).toBe('Ada');
    expect(document.activeElement).not.toBe(field);
    expect(update).not.toHaveBeenCalled();
  });

  it('Enter commits the edit', () => {
    render(<EditableName />);
    const field = screen.getByRole('textbox', { name: 'Your name' });
    field.focus();
    field.textContent = 'Grace';
    fireEvent.keyDown(field, { key: 'Enter' });
    expect(update).toHaveBeenCalledWith('general', { userName: 'Grace' });
  });
});
