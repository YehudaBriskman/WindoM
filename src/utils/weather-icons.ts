import {
  Sun, Moon, CloudSun, CloudMoon, Cloud, Cloudy,
  CloudDrizzle, CloudRain, CloudLightning, Snowflake,
  CloudFog, Wind, Tornado, Thermometer, type LucideIcon,
} from 'lucide-react';

/** OWM icon code → lucide-react component */
const WEATHER_ICON_MAP: Record<string, LucideIcon> = {
  '01d': Sun, '01n': Moon,
  '02d': CloudSun, '02n': CloudMoon,
  '03d': Cloud, '03n': Cloud,
  '04d': Cloudy, '04n': Cloudy,
  '09d': CloudDrizzle, '09n': CloudDrizzle,
  '10d': CloudRain, '10n': CloudRain,
  '11d': CloudLightning, '11n': CloudLightning,
  '13d': Snowflake, '13n': Snowflake,
  '50d': CloudFog, '50n': CloudFog,
};

/** Fallback: OWM condition string → lucide-react component */
const WEATHER_CONDITION_MAP: Record<string, LucideIcon> = {
  Clear: Sun,
  Clouds: Cloud,
  Rain: CloudRain,
  Drizzle: CloudDrizzle,
  Thunderstorm: CloudLightning,
  Snow: Snowflake,
  Mist: CloudFog,
  Fog: CloudFog,
  Haze: CloudFog,
  Smoke: CloudFog,
  Dust: CloudFog,
  Sand: CloudFog,
  Ash: CloudFog,
  Squall: Wind,
  Tornado: Tornado,
};

/** Resolve OWM data to a lucide-react icon component */
export function getWeatherIcon(iconCode?: string, condition?: string): LucideIcon {
  if (iconCode && WEATHER_ICON_MAP[iconCode]) return WEATHER_ICON_MAP[iconCode];
  if (condition && WEATHER_CONDITION_MAP[condition]) return WEATHER_CONDITION_MAP[condition];
  return Thermometer;
}
