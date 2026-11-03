import { Component, type ErrorInfo, type ReactNode } from 'react';
import './feedback.css';

interface ErrorBoundaryProps {
  /** Human name of the wrapped widget, used in the fallback and the console. */
  name: string;
  children: ReactNode;
  /**
   * Render nothing on failure instead of the inline fallback. For top-level
   * layout regions that are absolutely positioned: a fallback dropped into
   * document flow would land somewhere arbitrary, so the region just goes
   * away and the rest of the page keeps working.
   */
  silent?: boolean;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Isolates a widget so a render error in it does not unmount the whole
 * new-tab page. React only offers this as a class component.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[WindoM] ${this.props.name} crashed:`, error, info.componentStack);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (!this.state.error) return this.props.children;
    if (this.props.silent) return null;
    return <WidgetError name={this.props.name} onRetry={this.reset} />;
  }
}

export function WidgetError({ name, onRetry }: { name: string; onRetry?: () => void }) {
  return (
    <div className="widget-error" role="status">
      <span>{name} couldn’t load.</span>
      {onRetry && (
        <button type="button" className="widget-error-retry" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
