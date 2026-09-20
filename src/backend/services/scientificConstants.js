/**
 * Central Scientific Constants & Biophysical Parameters — BlueChain MRV System
 *
 * Source of truth for biological, allometric, carbon accounting, and silvicultural constants.
 * Citations:
 * - IPCC (2006, 2019 Refinement): Guidelines for National Greenhouse Gas Inventories (Agriculture, Forestry and Other Land Use)
 * - Komiyama, A., Ong, J.E., Poungparn, S. (2008): Allometry, biomass and productivity of mangrove forests. Aquatic Botany, 89(2), 128-137.
 * - Chave, J., et al. (2005): Tree allometry and improved estimation of carbon stocks and balance in tropical forests. Oecologia, 145(1), 87-99.
 * - Kauffman, J.B., Donato, D.C. (2012): Protocols for the measurement, monitoring and reporting of structure, biomass and carbon stocks in mangrove forests. CIFOR Working Paper 86.
 */

// ============================================================================
// 1. CARBON ACCOUNTING & CONVERSION CONSTANTS
// ============================================================================

/**
 * IPCC Standard Carbon Fraction of Dry Biomass for Mangrove Ecosystems.
 * Mangrove wood carbon content typically ranges between 0.44 and 0.50 (mean: 0.47).
 * Unit: dimensionless (tC / t Dry Biomass)
 */
const IPCC_CARBON_FRACTION = 0.47;

/**
 * Stoichiometric Molecular Mass Ratio of Carbon Dioxide (CO2) to Elemental Carbon (C).
 * Molecular weights: Carbon (C) = 12.011 g/mol, Oxygen (O) = 15.999 g/mol -> CO2 = 44.01 g/mol.
 * Ratio = 44.01 / 12.011 = 3.6667
 */
const MOLECULAR_RATIO_CO2_TO_C = 44 / 12;

// ============================================================================
// 2. BIOPHYSICAL GROWTH & DENSITY THRESHOLDS (MANGROVES)
// ============================================================================

/**
 * Maximum biologically plausible annual biomass accumulation rate for tropical mangroves.
 * Typical healthy mangrove restoration accumulates 5.0 to 18.0 t/ha/year of dry biomass.
 * Any reported growth exceeding 25.0 t/ha/year is flagged as biologically unrealistic.
 * Unit: t dry biomass / ha / year
 */
const MAX_MANGROVE_ANNUAL_BIOMASS_GAIN = 25.0;

/**
 * Maximum biologically plausible monthly biomass accumulation rate.
 * Unit: t dry biomass / ha / month
 */
const MAX_MANGROVE_MONTHLY_BIOMASS_GAIN = MAX_MANGROVE_ANNUAL_BIOMASS_GAIN / 12; // ~2.08 t/ha/month

/**
 * Silvicultural Planting Density Bounds for Blue Carbon Restoration.
 * Recommended density: 1,600 to 2,500 saplings/ha (e.g. 2m x 2m or 2.5m x 2.5m spacing).
 * Plausible range: 500 (sparse/enrichment) to 5,000 (dense seedling nursery/reforestation) trees/ha.
 */
const SILVICULTURAL_DENSITY_BOUNDS = {
  MIN_PLAUSIBLE_PER_HA: 500,
  MAX_PLAUSIBLE_PER_HA: 5000,
  RECOMMENDED_MIN_PER_HA: 1500,
  RECOMMENDED_MAX_PER_HA: 3000
};

/**
 * Global Geographic Latitude Bounds for Mangrove Ecosystems.
 * Mangroves naturally occur between 35°N (Japan, Bermuda) and 38°S (Australia, New Zealand).
 * Tropical/subtropical core distribution is between 25°N and 25°S.
 */
const MANGROVE_GEOGRAPHIC_BOUNDS = {
  LATITUDE_MIN: -35.0,
  LATITUDE_MAX: 35.0,
  CORE_LATITUDE_MIN: -25.0,
  CORE_LATITUDE_MAX: 25.0
};

// ============================================================================
// 3. PUBLISHED ALLOMETRIC MODEL PARAMETERS
// ============================================================================

/**
 * Wood specific gravities (dry density in g/cm3) by dominant mangrove species.
 * Source: World Agroforestry Wood Density Database & Kauffman & Donato (2012).
 */
const SPECIES_WOOD_DENSITY = {
  "Rhizophora mucronata": 0.71,
  "Rhizophora mangle": 0.69,
  "Rhizophora apiculata": 0.77,
  "Avicennia marina": 0.67,
  "Avicennia germinans": 0.64,
  "Sonneratia alba": 0.51,
  "Bruguiera gymnorhiza": 0.73,
  "Ceriops tagal": 0.75,
  "Generic Mangrove": 0.65
};

/**
 * Komiyama et al. (2008) Generic Mangrove Aboveground Biomass (AGB) Allometric Equation:
 * W_top = 0.251 * rho * (D ^ 2.46)
 * where:
 * W_top = dry aboveground biomass per tree (kg)
 * rho = wood density (g/cm3)
 * D = diameter at breast height (DBH, cm)
 */
const KOMIYAMA_MODEL = {
  name: "Komiyama et al. (2008) Generic Mangrove Allometric Model",
  citation: "Aquatic Botany 89(2): 128-137",
  coefficient: 0.251,
  exponent: 2.46,
  formula: "AGB (kg/tree) = 0.251 * rho * (DBH ^ 2.46)"
};

/**
 * Spectral Indices Formulas & Nominal Mangrove Bounds
 */
const SPECTRAL_FORMULAS = {
  NDVI: {
    name: "Normalized Difference Vegetation Index",
    formula: "NDVI = (NIR - RED) / (NIR + RED)",
    sentinelBands: { NIR: "Band 8 (842 nm)", RED: "Band 4 (665 nm)" },
    denseCanopyThreshold: 0.60,
    moderateVegetationThreshold: 0.40,
    sparseOrWaterThreshold: 0.20
  },
  EVI: {
    name: "Enhanced Vegetation Index",
    formula: "EVI = 2.5 * (NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1)",
    sentinelBands: { NIR: "Band 8 (842 nm)", RED: "Band 4 (665 nm)", BLUE: "Band 2 (490 nm)" },
    denseCanopyThreshold: 0.45,
    moderateVegetationThreshold: 0.25
  }
};

module.exports = {
  IPCC_CARBON_FRACTION,
  MOLECULAR_RATIO_CO2_TO_C,
  MAX_MANGROVE_ANNUAL_BIOMASS_GAIN,
  MAX_MANGROVE_MONTHLY_BIOMASS_GAIN,
  SILVICULTURAL_DENSITY_BOUNDS,
  MANGROVE_GEOGRAPHIC_BOUNDS,
  SPECIES_WOOD_DENSITY,
  KOMIYAMA_MODEL,
  SPECTRAL_FORMULAS
};
