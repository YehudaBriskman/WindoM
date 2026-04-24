import { Clock } from '../clock/Clock';
import { Greeting } from '../clock/Greeting';
import { FocusInput } from '../focus/FocusInput';
import { FocusPresets } from '../focus/FocusPresets';
import { FinanceStrip } from '../finance/FinanceStrip';

export function CenterContent() {
  return (
    <div className="center-content">
      <div className="center-content-inner">
        <Clock />
        <Greeting />
      </div>
      <FinanceStrip />
      <FocusInput />
      <FocusPresets />
    </div>
  );
}
