import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

let shouldThrow = true;
function Bomb() {
  if (shouldThrow) throw new Error('boom');
  return <p>widget body</p>;
}

describe('ErrorBoundary', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    shouldThrow = true;
    // React and the boundary both log the caught error; keep the run quiet.
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => consoleError.mockRestore());

  it('renders its children when nothing throws', () => {
    shouldThrow = false;
    render(
      <ErrorBoundary name="Tasks">
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByText('widget body')).toBeTruthy();
  });

  it('contains a crash to the widget and keeps its siblings on screen', () => {
    render(
      <>
        <ErrorBoundary name="Tasks">
          <Bomb />
        </ErrorBoundary>
        <p>sibling widget</p>
      </>,
    );
    expect(screen.getByRole('status').textContent).toContain('Tasks couldn’t load.');
    expect(screen.getByText('sibling widget')).toBeTruthy();
    expect(consoleError).toHaveBeenCalledWith('[WindoM] Tasks crashed:', expect.any(Error), expect.anything());
  });

  it('retries the widget from the fallback', () => {
    render(
      <ErrorBoundary name="Tasks">
        <Bomb />
      </ErrorBoundary>,
    );
    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(screen.getByText('widget body')).toBeTruthy();
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('renders nothing when silent', () => {
    const { container } = render(
      <ErrorBoundary name="Top bar" silent>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(container.innerHTML).toBe('');
  });
});
