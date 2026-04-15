import { getWeatherIcon } from '../../utils/weather-icons';

interface WeatherIconProps {
  iconCode?: string;
  condition?: string;
  isDay?: boolean;
  size?: number;
  className?: string;
}

export function WeatherIcon({ iconCode, condition, isDay, size = 28, className = '' }: WeatherIconProps) {
  const Icon = getWeatherIcon(iconCode, condition, isDay);
  return <Icon size={size} className={className} />;
}
