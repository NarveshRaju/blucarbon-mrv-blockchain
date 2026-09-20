/**
 * Satellite Environmental Verification Service — BlueChain MRV System
 *
 * Connects directly to Copernicus Data Space Ecosystem / Sentinel Hub Level-2A.
 * Computes real NDVI and EVI from Sentinel-2 MSI surface reflectance.
 *
 * STRICTLY NO MOCK DATA.
 */

const { SPECTRAL_FORMULAS } = require("./scientificConstants");
const { fetchSentinel2Data } = require("./copernicusService");

/**
 * Calculates NDVI from Sentinel-2 NIR (Band 8) and RED (Band 4) surface reflectance values.
 * @param {number} nir - Band 8 reflectance (0.0 to 1.0)
 * @param {number} red - Band 4 reflectance (0.0 to 1.0)
 * @returns {number|null} NDVI (-1.0 to +1.0)
 */
function calculateNDVI(nir, red) {
  if (nir === undefined || red === undefined || isNaN(nir) || isNaN(red)) return null;
  const denom = nir + red;
  if (denom === 0) return 0;
  return parseFloat(((nir - red) / denom).toFixed(4));
}

/**
 * Calculates EVI from Sentinel-2 NIR (Band 8), RED (Band 4), and BLUE (Band 2) reflectance values.
 * @param {number} nir - Band 8 reflectance
 * @param {number} red - Band 4 reflectance
 * @param {number} blue - Band 2 reflectance
 * @returns {number|null} EVI (-1.0 to +1.0)
 */
function calculateEVI(nir, red, blue) {
  if (nir === undefined || red === undefined || blue === undefined || isNaN(nir) || isNaN(red) || isNaN(blue)) {
    return null;
  }
  const denom = nir + 6 * red - 7.5 * blue + 1;
  if (denom === 0) return 0;
  return parseFloat((2.5 * ((nir - red) / denom)).toFixed(4));
}

/**
 * Executes Satellite Environmental Verification for a Project's Area of Interest (AOI).
 *
 * @param {object} project - Project document containing coordinates and observation dates
 * @returns {Promise<object>} Satellite verification results
 */
async function verifySatelliteData(project) {
  const lat = parseFloat(project.latitude);
  const lon = parseFloat(project.longitude);
  const radius = parseFloat(project.analysisRadius) || 2500;

  const findings = [];
  const warnings = [];
  const criticalIssues = [];
  const limitations = [
    "Satellite imagery verifies spectral vegetation presence across the AOI, but cannot prove planting ownership by a specific NGO.",
    "Cloud cover and atmospheric attenuation may introduce variance in optical indices."
  ];

  const hasCoords = !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0);

  if (!hasCoords) {
    return {
      module: "Satellite Environmental Verification",
      moduleKey: "satellite_verification",
      status: "UNAVAILABLE",
      satelliteSource: "Copernicus Sentinel-2 Level-2A",
      observationDates: null,
      ndvi: null,
      evi: null,
      findings: [],
      warnings: ["Coordinates missing: AOI bounding box cannot be computed for satellite query."],
      criticalIssues: ["Invalid coordinates for satellite tasking."],
      formulas: SPECTRAL_FORMULAS,
      limitations
    };
  }

  // Call real Copernicus Data Space API
  const copernicusResult = await fetchSentinel2Data(lat, lon, radius);

  if (copernicusResult.status === "SUCCESS") {
    findings.push(
      `Copernicus Observation Acquired: Sentinel-2 Level-2A imagery dated ${copernicusResult.observationDate.split("T")[0]} processed.`
    );
    findings.push(
      `Spectral NDVI: ${copernicusResult.ndvi} (${copernicusResult.vegetationHealthCategory}) across ${radius}m analysis zone.`
    );

    if (copernicusResult.evi !== null) {
      findings.push(`Spectral EVI: ${copernicusResult.evi} (Enhanced Vegetation Index).`);
    }

    if (copernicusResult.cloudCoveragePercentage > 25) {
      warnings.push(
        `Cloud Cover Notice: Observed scene has ${copernicusResult.cloudCoveragePercentage}% cloud coverage. Higher uncertainty in optical bands.`
      );
    }

    return {
      module: "Satellite Environmental Verification",
      moduleKey: "satellite_verification",
      status: "SUPPORTED",
      satelliteSource: copernicusResult.source,
      observationDates: [copernicusResult.observationDate],
      cloudCoverage: `${copernicusResult.cloudCoveragePercentage}%`,
      boundingBox: copernicusResult.boundingBox,
      bands: copernicusResult.bands,
      ndvi: copernicusResult.ndvi,
      evi: copernicusResult.evi,
      vegetationCategory: copernicusResult.vegetationHealthCategory,
      findings,
      warnings,
      criticalIssues,
      formulas: SPECTRAL_FORMULAS,
      limitations,
      timestamp: copernicusResult.timestamp
    };
  } else {
    // Transparently return UNAVAILABLE with the real technical reason
    warnings.push(
      `Copernicus satellite data could not be retrieved: ${copernicusResult.error || "Authentication or network issue"}`
    );

    return {
      module: "Satellite Environmental Verification",
      moduleKey: "satellite_verification",
      status: "UNAVAILABLE",
      satelliteSource: "Copernicus Sentinel-2 Level-2A",
      errorDetails: copernicusResult.error,
      boundingBox: copernicusResult.boundingBox,
      observationDates: null,
      ndvi: null,
      evi: null,
      findings: [],
      warnings,
      criticalIssues: [],
      formulas: SPECTRAL_FORMULAS,
      limitations,
      timestamp: copernicusResult.timestamp
    };
  }
}

module.exports = {
  calculateNDVI,
  calculateEVI,
  verifySatelliteData
};
