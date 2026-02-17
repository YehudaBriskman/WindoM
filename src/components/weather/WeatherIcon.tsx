import { getWeatherIcon } from '../../utils/weather-icons';

interface WeatherIconProps {
  iconCode?: string;
  condition?: string;
  size?: number;
  className?: string;
}

export function WeatherIcon({ iconCode, condition, size = 28, className = '' }: WeatherIconProps) {
  const Icon = getWeatherIcon(iconCode, condition);
  return <Icon size={size} className={className} />;
}
