import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useModalFocus } from './useModalFocus';

function Harness({ onEscape }: { onEscape: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useModalFocus(ref, onEscape);
  return (
    <div ref={ref} role="dialog" tabIndex={-1}>
      <button>one</button>
      <button>two</button>
    </div>
  );
}

describe('useModalFocus', () => {
  it('focuses the first control, wraps Tab, calls Escape handler and restores focus', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onEscape = vi.fn();
    const { unmount } = render(<Harness onEscape={onEscape} />);

    const one = screen.getByText('one');
    const two = screen.getByText('two');
    expect(document.activeElement).toBe(one);

    two.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(document.activeElement).toBe(one);
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(two);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onEscape).toHaveBeenCalledTimes(1);

    unmount();
    expect(document.activeElement).toBe(opener);
    opener.remove();
  });
});
