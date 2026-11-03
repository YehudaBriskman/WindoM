import { Clock } from '../clock/Clock';
import { Greeting } from '../clock/Greeting';
import { FocusInput } from '../focus/FocusInput';
import { FocusPresets } from '../focus/FocusPresets';
import { ErrorBoundary } from '../ui/ErrorBoundary';
import { FinanceDashboards } from '../finance/FinanceDashboards';

export function CenterContent() {
  return (
    <div className="center-content">
      <div className="center-content-inner">
        <ErrorBoundary name="Clock">
          <Clock />
        </ErrorBoundary>
        <ErrorBoundary name="Greeting">
          <Greeting />
        </ErrorBoundary>
      </div>
      <ErrorBoundary name="Finance">
        <FinanceDashboards />
      </ErrorBoundary>
      <ErrorBoundary name="Focus">
        <FocusInput />
      </ErrorBoundary>
      <ErrorBoundary name="Focus presets">
        <FocusPresets />
      </ErrorBoundary>
    </div>
  );
}
