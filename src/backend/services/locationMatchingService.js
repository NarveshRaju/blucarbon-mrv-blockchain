/**
 * Location Matching & Geographic Consistency Service — BlueChain MRV
 *
 * Compares submitted project coordinates and geographic location string against
 * location references, place names, and coordinates extracted from uploaded documents.
 */

const { calculateHaversineDistanceMeters } = require("./projectAuthenticityService");

/**
 * Extracts coordinate pairs from raw text if present (e.g. "12.345N, 80.123E" or "12.345, 80.123").
 */
function extractCoordinatesFromText(text) {
  if (!text || typeof text !== "string") return null;

  // Regex pattern for decimal coordinates
  const coordRegex = /([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/;
  const match = text.match(coordRegex);

  if (match) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      return { latitude: lat, longitude: lon };
    }
  }
  return null;
}

/**
 * Performs rigorous matching between submitted project location and document-extracted references.
 *
 * @param {object} project - Project document from MongoDB
 * @param {Array<object>} documentReports - Structured document reports from Gemini/OCR
 * @returns {object} Geographic location consistency report
 */
function matchLocationConsistency(project, documentReports = []) {
  const findings = [];
  const riskFlags = [];
  const limitations = [
    "Text-based document matching indicates semantic consistency, not exact GPS boundary certification.",
    "Official land survey boundaries must be verified by certified DAO human validators."
  ];

  const submittedLat = parseFloat(project.latitude);
  const submittedLon = parseFloat(project.longitude);
  const submittedLocation = (project.location || "").toLowerCase().trim();
  const hasCoords = !isNaN(submittedLat) && !isNaN(submittedLon);

  let coordinateMatchFound = false;
  let textMatchFound = false;
  let matchedPlaceNames = [];
  let coordinateMismatch = false;

  // Collect all extracted location references across all analyzed documents
  const allDocLocations = [];
  documentReports.forEach((doc) => {
    if (Array.isArray(doc.locationReferences)) {
      allDocLocations.push(...doc.locationReferences);
    }
  });

  // 1. Evaluate Document Coordinate Mentions
  for (const locRef of allDocLocations) {
    const docCoords = extractCoordinatesFromText(locRef);
    if (docCoords && hasCoords) {
      const distanceMeters = calculateHaversineDistanceMeters(
        submittedLat,
        submittedLon,
        docCoords.latitude,
        docCoords.longitude
      );

      const toleranceMeters = Math.max(5000, project.analysisRadius || 2500);

      if (distanceMeters <= toleranceMeters) {
        coordinateMatchFound = true;
        findings.push(
          `Coordinate Consistency: Document coordinates (${docCoords.latitude}, ${docCoords.longitude}) align within ${(distanceMeters / 1000).toFixed(2)} km of project center.`
        );
      } else {
        coordinateMismatch = true;
        riskFlags.push(
          `LOCATION_MISMATCH: Document mentions coordinates (${docCoords.latitude}, ${docCoords.longitude}) located ${(distanceMeters / 1000).toFixed(1)} km away from submitted project location.`
        );
      }
    }
  }

  // 2. Evaluate Textual Place Name Overlap
  if (submittedLocation) {
    const subWords = submittedLocation
      .split(/[,/\-\s]+/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 3);

    for (const locRef of allDocLocations) {
      const lowerRef = locRef.toLowerCase();
      for (const word of subWords) {
        if (lowerRef.includes(word)) {
          textMatchFound = true;
          if (!matchedPlaceNames.includes(locRef)) {
            matchedPlaceNames.push(locRef);
          }
        }
      }
    }
  }

  if (matchedPlaceNames.length > 0) {
    findings.push(
      `Textual Place Name Alignment: Document references match project region (${matchedPlaceNames.join(", ")}).`
    );
  }

  // 3. Determine Overall Geographic Match Status
  let status = "INSUFFICIENT_EVIDENCE";
  if (coordinateMismatch) {
    status = "POTENTIAL_INCONSISTENCY";
  } else if (coordinateMatchFound) {
    status = "SUPPORTED";
  } else if (textMatchFound) {
    status = "PARTIALLY_SUPPORTED";
  } else if (allDocLocations.length > 0) {
    status = "PARTIALLY_SUPPORTED";
    riskFlags.push("Document mentions geographic locations, but explicit match with submitted location name is ambiguous.");
  } else {
    status = "INSUFFICIENT_EVIDENCE";
    riskFlags.push("Uploaded documents do not contain explicit geographic place names or coordinates.");
  }

  return {
    module: "Geographic & Location Consistency",
    moduleKey: "location_consistency",
    status,
    submittedCoordinates: hasCoords ? { latitude: submittedLat, longitude: submittedLon } : null,
    submittedLocation: project.location || "N/A",
    extractedDocumentLocations: allDocLocations,
    matchedPlaceNames,
    coordinateMatchFound,
    findings,
    riskFlags,
    limitations
  };
}

module.exports = {
  extractCoordinatesFromText,
  matchLocationConsistency
};
