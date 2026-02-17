import { WeatherWidget } from '../weather/WeatherWidget';
import { QuickLinks } from '../links/QuickLinks';

export function TopBar() {
  return (
    <div className="top-bar">
      <WeatherWidget />
      <QuickLinks />
    </div>
  );
}
