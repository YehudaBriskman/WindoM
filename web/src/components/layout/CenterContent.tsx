import { Clock } from '../clock/Clock';
import { Greeting } from '../clock/Greeting';
import { FocusInput } from '../focus/FocusInput';
import { FocusPresets } from '../focus/FocusPresets';
import { FinanceDashboards } from '../finance/FinanceDashboards';

export function CenterContent() {
  return (
    <div className="center-content">
      <div className="center-content-inner">
        <Clock />
        <Greeting />
      </div>
      <FinanceDashboards />
      <FocusInput />
      <FocusPresets />
    </div>
  );
}
