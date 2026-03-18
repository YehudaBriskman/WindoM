/** Convert temperature between Fahrenheit and Celsius */
export function convertTemperature(temp: number, fromUnit: 'F' | 'C', toUnit: 'F' | 'C'): number {
  if (fromUnit === toUnit) return temp;
  if (fromUnit === 'F' && toUnit === 'C') return Math.round((temp - 32) * 5 / 9);
  if (fromUnit === 'C' && toUnit === 'F') return Math.round((temp * 9 / 5) + 32);
  return temp;
}
