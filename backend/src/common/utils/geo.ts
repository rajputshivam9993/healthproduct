const EARTH_RADIUS_M = 6_371_000;

/**
 * Great-circle distance between two lat/lng points in metres (haversine).
 * Used for proximity search in dev. Production should use PostGIS ST_Distance /
 * ST_DWithin against the geography column for index-backed performance (Req 5.1).
 */
export function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}
