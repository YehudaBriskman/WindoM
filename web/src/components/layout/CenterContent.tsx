import { Clock } from '../clock/Clock';
import { Greeting } from '../clock/Greeting';
import { FocusInput } from '../focus/FocusInput';
import { FocusPresets } from '../focus/FocusPresets';
import { CryptoWidget } from '../finance/CryptoWidget';

export function CenterContent() {
  return (
    <div className="center-content">
      <div className="center-content-inner">
        <Clock />
        <Greeting />
      </div>
      <CryptoWidget />
      <FocusInput />
      <FocusPresets />
    </div>
  );
}
