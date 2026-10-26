import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FocusOverlay } from '../FocusOverlay';

/**
 * The guide has always told users "Click anywhere or press Escape to exit focus
 * mode". Neither existed; the Stop button was the only way out. These pin both
 * down, and pin down that neither replays the exit animation.
 */

const stop = vi.fn();
let phase = 'active';

vi.mock('../../../contexts/FocusTimerContext', () => ({
  useFocusTimer: () => ({ phase, remaining: '12:34', stop }),
}));

vi.mock('../../clock/Clock', () => ({ Clock: () => <div>clock</div> }));

beforeEach(() => {
  stop.mockClear();
  phase = 'active';
});

describe('leaving focus mode', () => {
  it('renders nothing when idle', () => {
    phase = 'idle';
    const { container } = render(<FocusOverlay />);
    expect(container.firstChild).toBeNull();
  });

  it('exits on Escape', () => {
    render(<FocusOverlay />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('exits on a click anywhere on the overlay', () => {
    render(<FocusOverlay />);
    fireEvent.click(screen.getByText('12:34'));
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('exits once, not twice, when the Stop button is used', () => {
    // The button sits inside the overlay, so without stopPropagation one
    // activation would stop focus mode twice and restart the exit animation.
    render(<FocusOverlay />);
    fireEvent.click(screen.getByRole('button', { name: /stop focus/i }));
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('ignores keys that are not Escape', () => {
    render(<FocusOverlay />);
    fireEvent.keyDown(window, { key: 'Enter' });
    fireEvent.keyDown(window, { key: 'a' });
    expect(stop).not.toHaveBeenCalled();
  });

  it.each(['exiting-overlay', 'exiting'])(
    'does not restart the exit sequence during %s',
    (p) => {
      phase = p;
      render(<FocusOverlay />);
      fireEvent.keyDown(window, { key: 'Escape' });
      fireEvent.click(screen.getByText('12:34'));
      expect(stop).not.toHaveBeenCalled();
    },
  );

  it.each(['entering', 'entering-overlay'])('can be abandoned during %s', (p) => {
    phase = p;
    render(<FocusOverlay />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(stop).toHaveBeenCalledTimes(1);
  });
});
