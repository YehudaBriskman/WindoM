import { WeatherWidget } from '../weather/WeatherWidget';
import { GuidePanel } from '../onboarding/GuidePanel';

export function TopBar(): React.ReactElement {
  return (
    <div className="top-bar">
      <WeatherWidget />
      <GuidePanel />
    </div>
  );
}
