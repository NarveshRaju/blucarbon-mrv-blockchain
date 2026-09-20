/**
 * Project Authenticity & Duplicate Detection Service — BlueChain MRV System
 *
 * Evaluates real project authenticity and geospatial overlap against all existing
 * registered projects in the MongoDB database.
 * Computes exact Haversine distances and circular buffer / analysis zone overlap percentages.
 */

/**
 * Calculates Great-Circle Distance between two coordinates using the Haversine formula.
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in meters
 */
function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates the exact area overlap percentage between two circular analysis zones.
 * @param {number} r1 - Radius of circle 1 (meters)
 * @param {number} r2 - Radius of circle 2 (meters)
 * @param {number} d - Distance between centers (meters)
 * @returns {number} Overlap percentage (0 to 100)
 */
function calculateCircleOverlapPercentage(r1, r2, d) {
  if (d >= r1 + r2) return 0; // Completely separate
  if (d <= Math.abs(r1 - r2)) return 100; // One circle is completely enclosed in the other

  const r1sq = r1 * r1;
  const r2sq = r2 * r2;

  const alpha = Math.acos((d * d + r1sq - r2sq) / (2 * d * r1));
  const beta = Math.acos((d * d + r2sq - r1sq) / (2 * d * r2));

  const term1 = r1sq * alpha;
  const term2 = r2sq * beta;
  const term3 = 0.5 * Math.sqrt(
    Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2))
  );

  const intersectionArea = term1 + term2 - term3;
  const smallerCircleArea = Math.PI * Math.min(r1sq, r2sq);

  const overlapPct = (intersectionArea / smallerCircleArea) * 100;
  return Math.min(100, Math.max(0, parseFloat(overlapPct.toFixed(1))));
}

/**
 * Evaluates Project Authenticity & Detects Overlaps against MongoDB Projects.
 *
 * @param {object} currentProject - Project document being verified
 * @param {Array<object>} allProjects - All existing projects fetched from MongoDB
 * @returns {object} Authenticity analysis report
 */
function analyzeProjectAuthenticity(currentProject, allProjects = []) {
  const currentId = (currentProject._id || currentProject.projectId || "").toString();
  const currentLat = parseFloat(currentProject.latitude);
  const currentLon = parseFloat(currentProject.longitude);
  const currentRadius = parseFloat(currentProject.analysisRadius) || 2500;
  const currentName = (currentProject.projectName || currentProject.name || "").trim().toLowerCase();
  const currentWallet = (currentProject.walletAddress || "").toLowerCase();

  const findings = [];
  const warnings = [];
  const criticalIssues = [];
  const overlaps = [];
  const duplicateTitles = [];

  const hasCoords = !isNaN(currentLat) && !isNaN(currentLon) && currentLat !== 0 && currentLon !== 0;

  // Filter out the current project itself from comparison list
  const otherProjects = allProjects.filter((p) => {
    const pId = (p._id || p.projectId || "").toString();
    return pId && pId !== currentId;
  });

  if (otherProjects.length === 0) {
    findings.push("Initial project registered in database registry (no conflicting baseline records).");
  } else {
    findings.push(`Cross-referenced against ${otherProjects.length} registered BlueChain project records.`);
  }

  for (const other of otherProjects) {
    const otherId = (other._id || other.projectId || "").toString();
    const otherName = (other.projectName || other.name || "").trim();
    const otherLat = parseFloat(other.latitude);
    const otherLon = parseFloat(other.longitude);
    const otherRadius = parseFloat(other.analysisRadius) || 2500;
    const otherWallet = (other.walletAddress || "").toLowerCase();

    // 1. Check exact/near duplicate title
    if (currentName && otherName.toLowerCase() === currentName) {
      duplicateTitles.push({
        projectId: otherId,
        projectName: otherName,
        ngoId: other.ngoId
      });
    }

    // 2. Geospatial Overlap Check
    if (hasCoords && !isNaN(otherLat) && !isNaN(otherLon) && otherLat !== 0 && otherLon !== 0) {
      const distanceMeters = haversineDistanceMeters(currentLat, currentLon, otherLat, otherLon);
      const overlapPct = calculateCircleOverlapPercentage(currentRadius, otherRadius, distanceMeters);

      if (overlapPct > 5.0) {
        overlaps.push({
          projectId: otherId,
          projectName: otherName,
          ngoId: other.ngoId,
          distanceMeters: Math.round(distanceMeters),
          overlapPercentage: overlapPct,
          status: other.status
        });
      }
    }
  }

  // Evaluate Findings & Criticalities
  if (overlaps.length > 0) {
    overlaps.sort((a, b) => b.overlapPercentage - a.overlapPercentage);
    const maxOverlap = overlaps[0];

    if (maxOverlap.overlapPercentage >= 70.0) {
      criticalIssues.push(
        `Critical Geographic Collision: Analysis zone overlaps ${maxOverlap.overlapPercentage}% with existing project "${maxOverlap.projectName}" (${maxOverlap.projectId.slice(-8)}).`
      );
    } else if (maxOverlap.overlapPercentage >= 25.0) {
      warnings.push(
        `Significant Area Overlap: Analysis zone overlaps ${maxOverlap.overlapPercentage}% with existing project "${maxOverlap.projectName}" (${maxOverlap.projectId.slice(-8)}).`
      );
    } else {
      warnings.push(
        `Minor Boundary Proximity: Analysis zone intersects ${maxOverlap.overlapPercentage}% with adjacent project "${maxOverlap.projectName}" (${maxOverlap.projectId.slice(-8)}).`
      );
    }
  } else if (hasCoords) {
    findings.push("Geographic Buffer Isolation: No overlapping BlueChain project detected within project analysis zone.");
  }

  if (duplicateTitles.length > 0) {
    warnings.push(
      `Duplicate Project Title: Identical name matches ${duplicateTitles.length} existing project(s) (e.g. ${duplicateTitles[0].projectId.slice(-8)}).`
    );
  }

  let status = "PASS";
  if (criticalIssues.length > 0) {
    status = "FAIL";
  } else if (warnings.length > 0) {
    status = "FLAGGED";
  }

  return {
    module: "Project Authenticity & Duplicate Detection",
    moduleKey: "project_authenticity",
    status,
    findings,
    warnings,
    criticalIssues,
    details: {
      registeredProjectsCompared: otherProjects.length,
      detectedOverlaps: overlaps,
      duplicateTitles
    }
  };
}

module.exports = {
  analyzeProjectAuthenticity,
  haversineDistanceMeters,
  calculateCircleOverlapPercentage
};
