import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { GuidePanel } from './GuidePanel';

afterEach(cleanup);

const trigger = () => screen.getByRole('button', { name: 'Help & Guide' });

describe('GuidePanel keyboard contract', () => {
  it('reports its state on the trigger and moves focus into the panel', () => {
    render(<GuidePanel />);
    expect(trigger().getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(trigger());
    const panel = screen.getByRole('dialog', { name: 'WindoM Guide' });
    expect(trigger().getAttribute('aria-expanded')).toBe('true');
    expect(document.activeElement).toBe(panel);
    // Non-modal: the rest of the page stays usable, so it must not claim otherwise.
    expect(panel.hasAttribute('aria-modal')).toBe(false);
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<GuidePanel />);
    fireEvent.click(trigger());
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(trigger());
  });

  it('closes on a click outside, but not on a click inside', () => {
    render(
      <>
        <GuidePanel />
        <p>outside</p>
      </>,
    );
    fireEvent.click(trigger());
    fireEvent.pointerDown(screen.getByRole('dialog'));
    expect(screen.queryByRole('dialog')).not.toBeNull();
    fireEvent.pointerDown(screen.getByText('outside'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
