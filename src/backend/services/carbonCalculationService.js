/**
 * Carbon Calculation Service — BlueChain MRV System
 *
 * Implements rigorous, transparent Carbon Stock and CO2 equivalent (CO2e) accounting.
 * Strictly calculates values from verified biomass inputs with complete audit trails.
 */

const {
  IPCC_CARBON_FRACTION,
  MOLECULAR_RATIO_CO2_TO_C
} = require("./scientificConstants");

/**
 * Calculates Total Carbon Stock and Equivalent CO2 Sequestration.
 *
 * Formulas:
 * 1. Carbon Stock Density (tC/ha) = Biomass Density (t dry biomass/ha) * IPCC_CARBON_FRACTION (0.47)
 * 2. Total Project Carbon (tC) = Carbon Stock Density * Area (ha)
 * 3. Total CO2e Sequestered (tCO2e) = Total Project Carbon * (44 / 12)
 *
 * @param {object} params
 * @param {number} params.biomassTonnesPerHa - Biomass density (t dry biomass / ha)
 * @param {number} [params.areaHectares=1] - Project area in hectares
 * @param {number} [params.soilCarbonTonnesPerHa=0] - Soil organic carbon density (tC / ha)
 * @param {string} [params.calculationVersion="1.0.0-ipcc-tier1"] - Methodological tier
 * @returns {object} Transparent carbon accounting report with complete mathematical audit trail
 */
function calculateCarbonStockAndCO2e(params = {}) {
  const {
    biomassTonnesPerHa,
    areaHectares = 1,
    soilCarbonTonnesPerHa = 0,
    calculationVersion = "1.0.0-ipcc-tier1"
  } = params;

  if (biomassTonnesPerHa === undefined || biomassTonnesPerHa === null || isNaN(biomassTonnesPerHa)) {
    return {
      status: "DATA_INSUFFICIENT",
      message: "Biomass density input is missing; carbon calculations cannot proceed.",
      inputs: { biomassTonnesPerHa: null, areaHectares },
      outputs: null
    };
  }

  const validBiomass = Math.max(0, parseFloat(biomassTonnesPerHa));
  const validArea = Math.max(0.01, parseFloat(areaHectares) || 1);
  const validSoilC = Math.max(0, parseFloat(soilCarbonTonnesPerHa) || 0);

  // 1. Aboveground Carbon Density
  const vegetationCarbonDensity = validBiomass * IPCC_CARBON_FRACTION;
  // 2. Total Carbon Density (Vegetation + Soil Organic Carbon)
  const totalCarbonDensity = vegetationCarbonDensity + validSoilC;
  // 3. Project Total Carbon Stock
  const totalProjectCarbonTonnes = totalCarbonDensity * validArea;
  // 4. Equivalent CO2 (tCO2e)
  const totalCO2eTonnes = totalProjectCarbonTonnes * MOLECULAR_RATIO_CO2_TO_C;

  return {
    status: "CALCULATED",
    methodology: "IPCC Tier 1 Blue Carbon Accounting",
    calculationVersion,
    timestamp: new Date().toISOString(),
    inputs: {
      biomassDensityTonnesPerHa: validBiomass,
      projectAreaHectares: validArea,
      soilCarbonDensityTonnesPerHa: validSoilC,
      ipccCarbonFraction: IPCC_CARBON_FRACTION,
      molecularRatioCO2toC: parseFloat(MOLECULAR_RATIO_CO2_TO_C.toFixed(4))
    },
    formulas: {
      vegetationCarbon: "Vegetation Carbon (tC/ha) = Biomass (t/ha) * 0.47",
      totalCarbonDensity: "Total Carbon Density (tC/ha) = Vegetation Carbon + Soil Organic Carbon",
      totalProjectCarbon: "Total Carbon (tC) = Total Carbon Density * Area (ha)",
      co2Equivalent: "CO2e (tCO2e) = Total Carbon (tC) * (44 / 12)"
    },
    outputs: {
      vegetationCarbonDensityTonnesPerHa: parseFloat(vegetationCarbonDensity.toFixed(2)),
      totalCarbonDensityTonnesPerHa: parseFloat(totalCarbonDensity.toFixed(2)),
      totalProjectCarbonTonnes: parseFloat(totalProjectCarbonTonnes.toFixed(2)),
      totalCO2eTonnes: parseFloat(totalCO2eTonnes.toFixed(2))
    },
    units: {
      biomass: "t dry biomass / ha",
      carbonDensity: "tC / ha",
      totalCarbon: "tC",
      co2e: "tCO2e"
    },
    auditTrail: {
      equationC: `${validBiomass.toFixed(2)} t/ha * ${IPCC_CARBON_FRACTION} = ${vegetationCarbonDensity.toFixed(2)} tC/ha`,
      equationCO2e: `${totalProjectCarbonTonnes.toFixed(2)} tC * (44/12) = ${totalCO2eTonnes.toFixed(2)} tCO2e`,
      modelReference: "IPCC 2006/2019 Refinement Guidelines for AFOLU (Wetlands / Mangroves)"
    }
  };
}

module.exports = {
  calculateCarbonStockAndCO2e
};
