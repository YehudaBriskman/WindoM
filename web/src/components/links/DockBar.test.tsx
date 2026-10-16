import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DockBar } from './DockBar';

const { addLink } = vi.hoisted(() => ({ addLink: vi.fn() }));
vi.mock('../../contexts/SettingsContext', () => ({ useSettings: () => ({ settings: { widgets: { showLinks: true } } }) }));
vi.mock('../../hooks/useLinks', () => ({
  useLinks: () => ({ links: [{ name: 'Example', url: 'https://example.com', icon: '' }], addLink, removeLink: vi.fn() }),
}));
beforeEach(() => vi.clearAllMocks());

describe('DockBar URL entry', () => {
  function submit(url: string) {
    fireEvent.change(screen.getByPlaceholderText('https://...'), { target: { value: url } });
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
  }

  it.each(['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'ftp://example.com', 'https://'])('rejects unsupported destination %s', (url) => {
    render(<DockBar />);
    submit(url);
    expect(screen.getByRole('alert').textContent).toContain('HTTP or HTTPS');
    expect(addLink).not.toHaveBeenCalled();
  });

  it('normalizes a bare hostname before deriving the default name', () => {
    render(<DockBar />);
    submit(' www.example.com/path ');
    expect(addLink).toHaveBeenCalledWith({ name: 'example.com', url: 'https://www.example.com/path', icon: '' });
  });

  it('allows correction after an invalid URL and retains the chosen name', () => {
    render(<DockBar />);
    submit('javascript:alert(1)');
    fireEvent.change(screen.getByPlaceholderText('Name'), { target: { value: 'My link' } });
    submit('HTTPS://example.com');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(addLink).toHaveBeenCalledTimes(1);
    expect(addLink).toHaveBeenCalledWith({ name: 'My link', url: 'HTTPS://example.com', icon: '' });
  });
});
