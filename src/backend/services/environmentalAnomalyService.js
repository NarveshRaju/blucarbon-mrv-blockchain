/**
 * Environmental Anomaly & Mangrove Growth Verification Service — BlueChain MRV System
 *
 * Compares baseline environmental metrics and reported MRV time-series observations
 * against central biophysical thresholds in scientificConstants.js.
 * Detects biologically impossible biomass increases, tree density anomalies, and contradictory trends.
 */

const {
  MAX_MANGROVE_ANNUAL_BIOMASS_GAIN,
  MAX_MANGROVE_MONTHLY_BIOMASS_GAIN,
  SILVICULTURAL_DENSITY_BOUNDS
} = require("./scientificConstants");

/**
 * Evaluates Environmental Anomalies across Baseline and Monitoring Time Series.
 *
 * @param {object} project - Project document from MongoDB
 * @returns {object} Environmental anomaly detection report
 */
function analyzeEnvironmentalAnomalies(project) {
  const findings = [];
  const warnings = [];
  const criticalIssues = [];

  const baseline = project.baselineData || {};
  const mrvRecords = project.mrvRecords || [];
  const saplings = parseInt(project.saplingsPlanted || project.saplings || 0, 10);
  const areaHa = parseFloat(project.areaHectares) || 0;

  // 1. Silvicultural Planting Density Check
  if (saplings > 0 && areaHa > 0) {
    const density = saplings / areaHa;

    if (density < SILVICULTURAL_DENSITY_BOUNDS.MIN_PLAUSIBLE_PER_HA) {
      warnings.push(
        `Low Planting Density: ${Math.round(density)} trees/ha is below standard mangrove restoration density (${SILVICULTURAL_DENSITY_BOUNDS.RECOMMENDED_MIN_PER_HA}-${SILVICULTURAL_DENSITY_BOUNDS.RECOMMENDED_MAX_PER_HA} trees/ha).`
      );
    } else if (density > SILVICULTURAL_DENSITY_BOUNDS.MAX_PLAUSIBLE_PER_HA) {
      criticalIssues.push(
        `Biophysical Density Collision: ${Math.round(density).toLocaleString()} trees/ha exceeds the maximum plausible silvicultural carrying capacity (${SILVICULTURAL_DENSITY_BOUNDS.MAX_PLAUSIBLE_PER_HA} trees/ha).`
      );
    } else {
      findings.push(
        `Silvicultural Density Compliant: ${Math.round(density).toLocaleString()} trees/ha is within standard pantropical restoration guidelines.`
      );
    }
  }

  // 2. Baseline Biomass Bounds Check
  const baselineBiomass = parseFloat(baseline.biomass);
  if (!isNaN(baselineBiomass) && baselineBiomass > 0) {
    if (baselineBiomass > 450) {
      warnings.push(
        `High Baseline Biomass: ${baselineBiomass} t/ha indicates mature primary forest rather than degraded restoration site.`
      );
    } else {
      findings.push(`Baseline Biomass Calibrated: Initial stock recorded at ${baselineBiomass} t dry biomass/ha.`);
    }
  }

  // 3. Time-Series Biomass Growth Rate Anomaly Detection
  if (mrvRecords.length > 0 && !isNaN(baselineBiomass) && baselineBiomass > 0) {
    let previousBiomass = baselineBiomass;
    let previousDate = baseline.monitoringStartDate ? new Date(baseline.monitoringStartDate) : new Date(project.createdAt || Date.now());

    mrvRecords.forEach((mrv, idx) => {
      const currentBiomass = parseFloat(mrv.biomass);
      const currentDate = mrv.observationDate || mrv.monitoringDate ? new Date(mrv.observationDate || mrv.monitoringDate) : null;

      if (!isNaN(currentBiomass) && currentBiomass > 0 && currentDate && !isNaN(currentDate.getTime())) {
        const diffMonths = Math.max(0.5, (currentDate - previousDate) / (1000 * 60 * 60 * 24 * 30.4375));
        const biomassGain = currentBiomass - previousBiomass;

        if (biomassGain > 0) {
          const monthlyRate = biomassGain / diffMonths;
          const annualizedRate = monthlyRate * 12;

          if (annualizedRate > MAX_MANGROVE_ANNUAL_BIOMASS_GAIN) {
            criticalIssues.push(
              `Biological Growth Rate Anomaly: Claimed biomass gain of +${biomassGain.toFixed(1)} t/ha over ${diffMonths.toFixed(1)} months (${annualizedRate.toFixed(1)} t/ha/yr) exceeds maximum biological mangrove ceiling (${MAX_MANGROVE_ANNUAL_BIOMASS_GAIN} t/ha/yr).`
            );
          } else {
            findings.push(
              `Plausible Biomass Accumulation (Log #${idx + 1}): +${biomassGain.toFixed(1)} t/ha over ${diffMonths.toFixed(1)} months (${annualizedRate.toFixed(1)} t/ha/yr).`
            );
          }
        }

        previousBiomass = currentBiomass;
        previousDate = currentDate;
      }
    });
  }

  // 4. Check for Contradictory NDVI vs Biomass claims
  mrvRecords.forEach((mrv, idx) => {
    const ndvi = parseFloat(mrv.ndvi);
    const biomass = parseFloat(mrv.biomass);

    if (!isNaN(ndvi) && !isNaN(biomass) && ndvi < 0.25 && biomass > 150) {
      warnings.push(
        `Spectral Inconsistency (MRV #${idx + 1}): Low observed NDVI (${ndvi.toFixed(2)}) contradicts high claimed biomass (${biomass} t/ha).`
      );
    }
  });

  let status = "PASS";
  if (criticalIssues.length > 0) {
    status = "FAIL";
  } else if (warnings.length > 0) {
    status = "FLAGGED";
  }

  return {
    module: "Environmental Anomaly & Mangrove Growth Detection",
    moduleKey: "environmental_anomalies",
    status,
    findings,
    warnings,
    criticalIssues,
    thresholdsApplied: {
      maxAnnualBiomassGain: `${MAX_MANGROVE_ANNUAL_BIOMASS_GAIN} t/ha/year`,
      minSilviculturalDensity: `${SILVICULTURAL_DENSITY_BOUNDS.MIN_PLAUSIBLE_PER_HA} trees/ha`,
      maxSilviculturalDensity: `${SILVICULTURAL_DENSITY_BOUNDS.MAX_PLAUSIBLE_PER_HA} trees/ha`
    }
  };
}

module.exports = {
  analyzeEnvironmentalAnomalies
};
