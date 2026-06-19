/**
 * Approximate center coordinates for supported cities. Used so a doctor who has a
 * recognised `city` but no explicit lat/long still participates in proximity
 * search (the city center is used as a fallback location). Keep in sync with the
 * app's CITY_OPTIONS.
 */
export const CITY_COORDS: Record<string, { latitude: number; longitude: number }> = {
  bengaluru: { latitude: 12.9716, longitude: 77.5946 },
  bangalore: { latitude: 12.9716, longitude: 77.5946 },
  mumbai: { latitude: 19.076, longitude: 72.8777 },
  delhi: { latitude: 28.6139, longitude: 77.209 },
  'new delhi': { latitude: 28.6139, longitude: 77.209 },
  hyderabad: { latitude: 17.385, longitude: 78.4867 },
  chennai: { latitude: 13.0827, longitude: 80.2707 },
  pune: { latitude: 18.5204, longitude: 73.8567 },
  kolkata: { latitude: 22.5726, longitude: 88.3639 },
};

/** Returns center coords for a city name (case-insensitive), or null if unknown. */
export function cityCoords(city: string | null): { latitude: number; longitude: number } | null {
  if (!city) return null;
  return CITY_COORDS[city.trim().toLowerCase()] ?? null;
}
