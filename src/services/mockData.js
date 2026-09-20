/**
 * Mock Data — centralized demo/placeholder data.
 *
 * This file is the ONLY place where demonstration data should live.
 * Components should import from here rather than defining inline mock data.
 *
 * All items are clearly labeled as demo data.
 */

/**
 * Plantation/ecosystem type options used in project forms.
 */
export const PLANTATION_TYPES = [
  { value: 'Mangrove', label: 'Mangrove' },
  { value: 'Seagrass', label: 'Seagrass' },
  { value: 'Salt Marsh', label: 'Salt Marsh' },
  { value: 'Tidal Wetland', label: 'Tidal Wetland' },
  { value: 'Kelp Forest', label: 'Kelp Forest' },
  { value: 'Other', label: 'Other' },
];

/**
 * Ecosystem type options for MRV baseline.
 */
export const ECOSYSTEM_TYPES = [
  { value: 'Mangrove Forest', label: 'Coastal Mangrove Forest' },
  { value: 'Seagrass Meadow', label: 'Seagrass Meadow' },
  { value: 'Tidal Saltmarsh', label: 'Tidal Saltmarsh' },
  { value: 'Coastal Wetland', label: 'Estuarine Coastal Wetland' },
  { value: 'Other Coastal Ecosystem', label: 'Other Blue Carbon Habitat' },
];

/**
 * Mangrove species/category classifications.
 */
export const MANGROVE_CATEGORIES = [
  { value: 'Rhizophora (Red Mangrove)', label: 'Rhizophora (Red Mangrove - Estuarine)' },
  { value: 'Avicennia (Grey/Black Mangrove)', label: 'Avicennia (Grey/Black Mangrove - High Salinity)' },
  { value: 'Sonneratia (Apple Mangrove)', label: 'Sonneratia (Apple Mangrove - Riverbank)' },
  { value: 'Ceriops (Yellow Mangrove)', label: 'Ceriops (Yellow Mangrove - High Intertidal)' },
  { value: 'Mixed Mangrove Complex', label: 'Mixed Mangrove Complex (Multi-species)' },
];

/**
 * Restoration intervention types.
 */
export const RESTORATION_TYPES = [
  { value: 'Afforestation', label: 'Afforestation (Planting on New Coastal Mudflats)' },
  { value: 'Reforestation', label: 'Reforestation (Re-establishing Degraded Forest)' },
  { value: 'Assisted Natural Regeneration', label: 'Assisted Natural Regeneration (Hydrological Restoration)' },
  { value: 'Erosion Barrier & Buffer', label: 'Coastal Protection & Wave Barrier' },
];

/**
 * Vegetation condition ratings.
 */
export const VEGETATION_CONDITIONS = [
  { value: 'Healthy', label: 'Healthy (Dense Canopy & Vigorous Growth)' },
  { value: 'Improving', label: 'Improving (Noticeable Biomass Increase)' },
  { value: 'Moderate', label: 'Moderate (Scattered Canopy & Stable)' },
  { value: 'Under Restoration', label: 'Under Restoration (Early Seedling Stage)' },
  { value: 'Degraded', label: 'Degraded (Sparse / Disturbed)' },
];

/**
 * Monitoring data sources.
 */
export const DATA_SOURCES = [
  { value: 'Satellite Observation', label: 'Satellite Observation (Sentinel-2 / Landsat-8)' },
  { value: 'Field Survey', label: 'Ground Field Survey & GPS Transects' },
  { value: 'NGO Evidence', label: 'NGO Photographic & Drone Evidence' },
  { value: 'Remote Sensing Dataset', label: 'Third-Party Remote Sensing & GIS Dataset' },
  { value: 'Other', label: 'Other Verified Data Source' },
];

/**
 * Derived MRV lifecycle statuses.
 */
export const MRV_STATUSES = {
  baseline_required: { label: 'Baseline Required', color: 'draft', step: 1 },
  baseline_ready: { label: 'Baseline Ready', color: 'submitted', step: 2 },
  monitoring_active: { label: 'Monitoring Active', color: 'under_review', step: 3 },
  ready_for_verification: { label: 'Ready for Verification', color: 'approved', step: 4 },
  verified: { label: 'MRV Verified', color: 'verified', step: 5 },
};

/**
 * Project status definitions.
 */
export const PROJECT_STATUSES = {
  draft: { label: 'Draft', color: 'draft' },
  submitted: { label: 'Submitted', color: 'submitted' },
  pending: { label: 'Pending', color: 'pending' },
  under_review: { label: 'Under Review', color: 'under_review' },
  approved: { label: 'Approved', color: 'approved' },
  verified: { label: 'Verified', color: 'verified' },
  rejected: { label: 'Rejected', color: 'rejected' },
};

/**
 * NGO onboarding — areas of focus options.
 */
export const NGO_FOCUS_AREAS = [
  'Mangrove Restoration',
  'Seagrass Conservation',
  'Coastal Wetland Protection',
  'Marine Biodiversity',
  'Community Development',
  'Climate Research',
  'Carbon Credit Development',
  'Environmental Education',
];

/**
 * Sample/demo baseline data generator for demonstration projects.
 */
export const getSampleBaselineData = (projectId = '', overrides = {}) => ({
  projectId,
  projectArea: overrides.areaHectares || 25,
  ecosystemType: overrides.plantationType ? `${overrides.plantationType} Forest` : 'Mangrove Forest',
  mangroveCategory: 'Rhizophora (Red Mangrove)',
  restorationType: 'Reforestation',
  monitoringStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  vegetationCondition: 'Moderate',
  biomass: 42.5, // t/ha
  carbonStock: 68.2, // tCO₂e
  soilCarbon: 110.0, // tC/ha
  sequestrationRate: 3.4, // tCO₂e/yr
  assessmentDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  notes: 'Pre-restoration baseline survey recorded moderate seedling density with viable tidal hydrology.',
  ...overrides,
});

/**
 * Sample/demo MRV monitoring timeline records for demonstration projects.
 */
export const getSampleMRVRecords = (projectId = '', baseline = {}) => {
  const baseArea = baseline.projectArea || 25;
  const baseBiomass = baseline.biomass || 42.5;
  const baseCarbon = baseline.carbonStock || 68.2;

  return [
    {
      id: `mrv_${projectId}_1`,
      monitoringDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observationDate: new Date(Date.now() - 92 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dataSource: 'Satellite Observation',
      ndvi: 0.58,
      evi: 0.42,
      biomass: Number((baseBiomass * 1.08).toFixed(1)),
      carbonStock: Number((baseCarbon * 1.09).toFixed(1)),
      areaCovered: baseArea,
      mangroveCondition: 'Improving',
      biomassChange: '+8.0%',
      carbonChange: '+9.0%',
      areaChange: '0.0%',
      notes: 'Initial satellite pass (Sentinel-2) detected canopy expansion across high-tide zones.',
    },
    {
      id: `mrv_${projectId}_2`,
      monitoringDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      observationDate: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      dataSource: 'Field Survey',
      ndvi: 0.71,
      evi: 0.55,
      biomass: Number((baseBiomass * 1.22).toFixed(1)),
      carbonStock: Number((baseCarbon * 1.24).toFixed(1)),
      areaCovered: baseArea,
      mangroveCondition: 'Healthy',
      biomassChange: '+22.0%',
      carbonChange: '+24.0%',
      areaChange: '+1.5%',
      notes: 'Field transect verification confirmed high sapling survival (>88%) and robust root establishment.',
    },
  ];
};
