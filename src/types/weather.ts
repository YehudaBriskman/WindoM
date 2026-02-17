export interface WeatherData {
  temp: number;
  condition: string;
  description: string;
  iconCode: string;
  city: string;
  unit: 'F' | 'C';
  timestamp: number;
}

export interface LocationCoords {
  lat: number;
  lon: number;
}

export interface CachedLocation extends LocationCoords {
  timestamp: number;
}
