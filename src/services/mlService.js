import { API_BASE_URL } from './api';

/**
 * Run Sentinel-2 & Google Earth Engine ML analysis for a project's location.
 *
 * @param {number} lat - Latitude (-90 to 90)
 * @param {number} lon - Longitude (-180 to 180)
 * @param {number} startYear - e.g. 2020
 * @param {number} endYear - e.g. 2026
 * @param {number} radiusKm - Analysis radius in km (1-10)
 * @returns {Promise<Object>} Analysis response with yearly metrics
 */
export async function analyzeProjectMangrove(lat, lon, startYear = 2020, endYear = 2026, radiusKm = 5) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ml/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: Number(lat),
        lon: Number(lon),
        start_year: Number(startYear),
        end_year: Number(endYear),
        radius_km: Number(radiusKm)
      })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `ML Analysis failed (HTTP ${res.status})`);
    }

    return await res.json();
  } catch (err) {
    console.warn('ML Analysis service notice:', err.message);
    throw err;
  }
}

/**
 * Compare NGO claimed extent vs Sentinel-2 ML detected extent
 */
export function calculateDiscrepancy(claimedHectares, detectedHectares) {
  const claimed = Number(claimedHectares) || 0;
  const detected = Number(detectedHectares) || 0;

  if (claimed === 0 && detected === 0) {
    return {
      claimed,
      detected,
      diff: 0,
      diffPercent: 0,
      matchRate: 100,
      status: 'PASS',
      statusLabel: 'Coinciding Extent',
      color: '#16a34a'
    };
  }

  const diff = Math.abs(detected - claimed);
  const diffPercent = claimed > 0 ? (diff / claimed) * 100 : 100;
  const matchRate = Math.max(0, 100 - diffPercent);

  let status = 'PASS';
  let statusLabel = 'High Fidelity Match';
  let color = '#16a34a';

  if (diffPercent > 25) {
    status = 'FAIL';
    statusLabel = 'Significant Area Discrepancy';
    color = '#dc2626';
  } else if (diffPercent > 10) {
    status = 'FLAGGED';
    statusLabel = 'Moderate Variance';
    color = '#d97706';
  }

  return {
    claimed,
    detected: +detected.toFixed(2),
    diff: +diff.toFixed(2),
    diffPercent: +diffPercent.toFixed(1),
    matchRate: +matchRate.toFixed(1),
    status,
    statusLabel,
    color
  };
}
