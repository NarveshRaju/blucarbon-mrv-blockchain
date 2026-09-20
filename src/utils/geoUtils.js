/**
 * Geographic Utility Functions for BlueChain MRV Location and Analysis Zones.
 */

export const DEFAULT_MAP_CENTER = [19.0760, 72.8777]; // Default coastal reference
export const DEFAULT_ANALYSIS_RADIUS_METERS = 500;
export const MIN_ANALYSIS_RADIUS = 100;
export const MAX_ANALYSIS_RADIUS = 5000;

/**
 * Validates latitude and longitude ranges.
 * @param {number|string} lat 
 * @param {number|string} lng 
 * @returns {boolean}
 */
export const isValidCoordinate = (lat, lng) => {
  const parsedLat = parseFloat(lat);
  const parsedLng = parseFloat(lng);
  return (
    !isNaN(parsedLat) &&
    !isNaN(parsedLng) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLng >= -180 &&
    parsedLng <= 180
  );
};

/**
 * Parses coordinates from a composite location string (e.g. "Ratnagiri Estuary (19.076, 72.8777)").
 * @param {string} locationStr 
 * @returns {{ latitude: number, longitude: number, name: string } | null}
 */
export const parseCoordinatesFromLocation = (locationStr) => {
  if (!locationStr || typeof locationStr !== 'string') return null;

  // Match pattern: "... (19.0760, 72.8777)" or "19.0760, 72.8777"
  const regex = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/;
  const match = locationStr.match(regex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    if (isValidCoordinate(lat, lng)) {
      const name = locationStr.replace(/\s*\(-?\d+(?:\.\d+)?\s*,\s*-?\d+(?:\.\d+)?\)/, '').trim();
      return { latitude: lat, longitude: lng, name: name || locationStr };
    }
  }

  return null;
};

/**
 * Formats a coordinate with directional hemisphere indicator (N/S, E/W).
 * @param {number} coord 
 * @param {'lat'|'lng'} type 
 * @param {number} [decimals=5]
 * @returns {string}
 */
export const formatCoordinate = (coord, type, decimals = 5) => {
  const val = parseFloat(coord);
  if (isNaN(val)) return 'N/A';

  const fixed = Math.abs(val).toFixed(decimals);
  if (type === 'lat') {
    return `${fixed}° ${val >= 0 ? 'N' : 'S'}`;
  }
  return `${fixed}° ${val >= 0 ? 'E' : 'W'}`;
};

/**
 * Formats radius into meters or kilometers.
 * @param {number} radiusMeters 
 * @returns {string}
 */
export const formatRadius = (radiusMeters) => {
  const r = parseFloat(radiusMeters);
  if (isNaN(r) || r <= 0) return '0 m';
  if (r >= 1000) {
    return `${(r / 1000).toFixed(1)} km`;
  }
  return `${Math.round(r)} m`;
};

/**
 * Calculates approximate circular zone surface area in hectares.
 * Area = pi * r^2 (in m^2) / 10,000 (m^2 per hectare)
 * @param {number} radiusMeters 
 * @returns {number} Area in hectares
 */
export const estimateZoneAreaHectares = (radiusMeters) => {
  const r = parseFloat(radiusMeters);
  if (isNaN(r) || r <= 0) return 0;
  const areaM2 = Math.PI * Math.pow(r, 2);
  return parseFloat((areaM2 / 10000).toFixed(1));
};
