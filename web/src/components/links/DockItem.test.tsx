import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DockItem } from './DockItem';

describe('DockItem saved URL safety', () => {
  it.each(['javascript:alert(1)', 'data:text/html,test', 'chrome://settings', 'https://', ''])('disables unsafe saved URL %s but preserves removal', (url) => {
    const remove = vi.fn();
    const { container } = render(<DockItem link={{ name: 'Saved', url, icon: '' }} onRemove={remove} />);
    expect(container.querySelector('a')?.hasAttribute('href')).toBe(false);
    expect(container.querySelector('a')?.getAttribute('aria-disabled')).toBe('true');
    expect(container.querySelector('img')).toBeNull();
    fireEvent.click(screen.getByTitle('Remove'));
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('keeps valid HTTP(S) links navigable', () => {
    render(<DockItem link={{ name: 'Saved', url: 'https://example.com', icon: '' }} />);
    expect(screen.getByRole('link').getAttribute('href')).toBe('https://example.com');
    expect(screen.getByRole('link').hasAttribute('aria-disabled')).toBe(false);
  });
});
