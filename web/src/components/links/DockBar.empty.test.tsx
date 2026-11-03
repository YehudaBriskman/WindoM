import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DockBar } from './DockBar';

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({ settings: { widgets: { showLinks: true } } }),
}));
vi.mock('../../hooks/useLinks', () => ({
  useLinks: () => ({ links: [], addLink: vi.fn(), removeLink: vi.fn() }),
}));

describe('DockBar with no links', () => {
  it('shows an empty state and keeps the add form reachable instead of vanishing', () => {
    render(<DockBar />);
    expect(screen.getByText('No links yet. Use + below to add one.')).toBeTruthy();
    expect(screen.getByLabelText('Link URL')).toBeTruthy();
  });
});
