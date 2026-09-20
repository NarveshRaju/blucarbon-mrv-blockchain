/**
 * Geographic & Land Plausibility Screening Service — BlueChain MRV System
 *
 * Implements biophysical geographic bounds screening and land authorization document analysis.
 * NOTE: Strictly adheres to legal transparency: does NOT claim legal ownership is verified
 * without an authoritative government land registry API integration.
 */

const { MANGROVE_GEOGRAPHIC_BOUNDS } = require("./scientificConstants");

/**
 * Evaluates Geographic Plausibility and Land Authorization Status.
 *
 * @param {object} project - Project document from MongoDB
 * @returns {object} Geographic plausibility report
 */
function analyzeGeographicPlausibility(project) {
  const findings = [];
  const warnings = [];
  const criticalIssues = [];

  const lat = parseFloat(project.latitude);
  const lon = parseFloat(project.longitude);
  const radiusMeters = parseFloat(project.analysisRadius) || 2500;
  const declaredAreaHa = parseFloat(project.areaHectares) || 0;
  const pType = (project.plantationType || "").toLowerCase();

  const hasCoords = !isNaN(lat) && !isNaN(lon) && (lat !== 0 || lon !== 0);

  if (!hasCoords) {
    criticalIssues.push("Geographic coordinates are missing or uncalibrated (Latitude/Longitude = 0,0).");
  } else {
    // 1. Basic coordinate valid range
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      criticalIssues.push(`Invalid geographic coordinates: Latitude (${lat}) or Longitude (${lon}) exceeds global limits.`);
    } else {
      findings.push(`Valid geographic coordinates recorded: [${lat.toFixed(6)}, ${lon.toFixed(6)}].`);

      // 2. Mangrove biophysical latitude boundary check
      const isMangrove = pType.includes("mangrove") || !pType;
      if (isMangrove) {
        if (lat < MANGROVE_GEOGRAPHIC_BOUNDS.LATITUDE_MIN || lat > MANGROVE_GEOGRAPHIC_BOUNDS.LATITUDE_MAX) {
          criticalIssues.push(
            `Biophysical Latitudinal Anomaly: Latitude ${lat.toFixed(4)}° is outside the global biophysical range for mangrove ecosystems (±35.0°).`
          );
        } else if (lat >= MANGROVE_GEOGRAPHIC_BOUNDS.CORE_LATITUDE_MIN && lat <= MANGROVE_GEOGRAPHIC_BOUNDS.CORE_LATITUDE_MAX) {
          findings.push(`Biophysical Latitude Match: Coordinates fall within the core tropical/subtropical mangrove distribution zone (±25.0°).`);
        } else {
          warnings.push(`Sub-optimal Latitudinal Margin: Latitude ${lat.toFixed(4)}° is near the marginal limit of mangrove growth.`);
        }
      }
    }
  }

  // 3. Analysis Zone Geometry vs Declared Area
  const bufferAreaHa = (Math.PI * Math.pow(radiusMeters, 2)) / 10000;
  if (declaredAreaHa > 0) {
    if (declaredAreaHa > bufferAreaHa) {
      warnings.push(
        `Geometric Discrepancy: Declared restoration area (${declaredAreaHa} ha) exceeds the total area of the analysis zone buffer (${bufferAreaHa.toFixed(1)} ha).`
      );
    } else {
      findings.push(
        `Geometric Consistency: Declared area (${declaredAreaHa} ha) is fully bounded within the ${radiusMeters}m analysis zone buffer (${bufferAreaHa.toFixed(1)} ha).`
      );
    }
  } else {
    findings.push(`Analysis zone buffer set to ${radiusMeters}m radius (${bufferAreaHa.toFixed(1)} ha total buffer).`);
  }

  // 4. Land Authorization Document Screening
  const evidenceList = project.evidence || [];
  const landAuthDocs = evidenceList.filter((e) => {
    const cat = (e.category || "").toLowerCase();
    const name = (e.fileName || e.originalName || "").toLowerCase();
    return (
      cat.includes("land") ||
      cat.includes("ownership") ||
      cat.includes("authorization") ||
      cat.includes("permit") ||
      name.includes("land") ||
      name.includes("permit") ||
      name.includes("auth") ||
      name.includes("deed") ||
      name.includes("title")
    );
  });

  if (landAuthDocs.length > 0) {
    findings.push(
      `Land Authorization Evidence: ${landAuthDocs.length} land title/permit document(s) uploaded for manual validator review.`
    );
  } else {
    warnings.push("Land Authorization Notice: No explicit land tenure/authorization permit detected in evidence package.");
  }

  // Mandatory Legal Disclaimer
  const legalNotice =
    "Land authorization status is evaluated for plausibility only. Official legal land ownership cannot be automatically certified without an integrated government land registry API. Certified Human Validator review is required.";

  let status = "PASS";
  if (criticalIssues.length > 0) {
    status = "FAIL";
  } else if (warnings.length > 0) {
    status = "FLAGGED";
  }

  return {
    module: "Land & Geographic Plausibility",
    moduleKey: "geographic_plausibility",
    status,
    findings,
    warnings,
    criticalIssues,
    legalNotice,
    details: {
      latitude: hasCoords ? lat : null,
      longitude: hasCoords ? lon : null,
      analysisRadiusMeters: radiusMeters,
      bufferAreaHectares: parseFloat(bufferAreaHa.toFixed(2)),
      declaredAreaHectares: declaredAreaHa,
      landAuthorizationDocsCount: landAuthDocs.length
    }
  };
}

module.exports = {
  analyzeGeographicPlausibility
};
