import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TodoItem } from './sidebar/TodoItem';
import { OnboardingModal } from './onboarding/OnboardingModal';
import { SettingsNav } from './settings/SettingsNav';
import { DockBar } from './links/DockBar';

vi.mock('../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { widgets: { showLinks: true } } }),
}));
vi.mock('../hooks/useLinks', () => ({
  useLinks: () => ({ links: [], addLink: vi.fn(), removeLink: vi.fn() }),
}));

describe('accessibility contracts', () => {
  it('todo checkbox and remove button carry the task text in their names', () => {
    render(<TodoItem todo={{ id: '1', text: 'Buy milk', completed: false }} onToggle={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('checkbox', { name: 'Buy milk' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove task: Buy milk' })).toBeTruthy();
  });

  it('onboarding is a labelled modal dialog, takes focus and Escape completes it', () => {
    const onComplete = vi.fn().mockResolvedValue(undefined);
    render(<OnboardingModal onComplete={onComplete} />);
    const dialog = screen.getByRole('dialog', { name: 'Welcome to WindoM' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onComplete).toHaveBeenCalled();
  });

  it('settings nav marks the current section', () => {
    render(<SettingsNav active="clock" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Clock' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'General' }).getAttribute('aria-current')).toBeNull();
  });

  it('dock add control is a real button that expands the form, and Escape cancels', () => {
    render(<DockBar />);
    const add = screen.getByRole('button', { name: 'Add link' });
    expect(add.tagName).toBe('BUTTON');
    expect(add.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(add);
    expect(add.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(screen.getByLabelText('Link name'), { key: 'Escape' });
    expect(add.getAttribute('aria-expanded')).toBe('false');
  });
});
