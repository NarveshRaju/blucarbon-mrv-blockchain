/**
 * Project Explorer Utility Functions
 * Normalizes, filters, sorts, and aggregates project records for public discovery.
 * Ensures 100% backwards compatibility with both legacy and new project document schemas.
 */

import { parseCoordinatesFromLocation } from './geoUtils';
import { normalizeStatus, getStatusConfig } from './projectStatus';
import { getProjectBaseline, getProjectMRVRecords, deriveMRVStatus } from '../services/projectService';

/**
 * Normalizes a raw project object into a safe, standard representation.
 *
 * @param {object} p - Raw project document
 * @returns {object} Normalized project for Explorer
 */
export const normalizeProjectForExplorer = (p) => {
  if (!p) return null;

  const id = p.projectId || p._id || `proj_${Math.random().toString(36).substr(2, 6)}`;
  const name = p.projectName || 'Untitled Project';
  const rawStatus = p.status || 'Pending';
  const normStatus = normalizeStatus(p);
  const statusConfig = getStatusConfig(p);
  const plantationType = p.plantationType || p.ecosystemType || 'Mangrove';
  const location = p.location || 'Coastal Site';
  const saplings = Number(p.saplingsPlanted || p.noOfPlantations || 0);

  // Parse Coordinates
  let lat = !isNaN(parseFloat(p.latitude)) ? parseFloat(p.latitude) : null;
  let lng = !isNaN(parseFloat(p.longitude)) ? parseFloat(p.longitude) : null;
  if ((lat === null || lng === null) && p.location) {
    const parsed = parseCoordinatesFromLocation(p.location);
    if (parsed) {
      lat = parsed.latitude;
      lng = parsed.longitude;
    }
  }

  const hasValidCoordinates = lat !== null && lng !== null &&
    lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

  const radius = Number(p.analysisRadius || 500);

  // Evidence count and image source
  const evidenceCount = p.evidence?.length || p.imageBase64s?.length || (p.imageUrl ? 1 : 0);
  const imageUrl = p.imageUrl || (p.imageBase64s && p.imageBase64s.length > 0 ? p.imageBase64s[0] : null);

  // Baseline & MRV Metrics
  const baseline = getProjectBaseline(id, p);
  const mrvRecords = getProjectMRVRecords(id, p);
  const mrvStatus = deriveMRVStatus(p, baseline, mrvRecords);

  // Area calculation: use explicit areaHectares, or baseline projectArea, or estimate from saplings (~100 saplings/ha)
  let areaHectares = 0;
  if (p.areaHectares && !isNaN(parseFloat(p.areaHectares))) {
    areaHectares = parseFloat(p.areaHectares);
  } else if (baseline?.projectArea && !isNaN(parseFloat(baseline.projectArea))) {
    areaHectares = parseFloat(baseline.projectArea);
  } else if (saplings > 0) {
    areaHectares = parseFloat((saplings / 100).toFixed(1));
  } else {
    areaHectares = 10.0;
  }

  // Carbon stock
  let carbonStock = 0;
  if (baseline?.carbonStock && !isNaN(parseFloat(baseline.carbonStock))) {
    carbonStock = parseFloat(baseline.carbonStock);
  } else if (p.carbonSequestered && !isNaN(parseFloat(p.carbonSequestered))) {
    carbonStock = parseFloat(p.carbonSequestered);
  } else {
    // Standard default estimate based on area and saplings (approx 2.5 tCO2e/ha)
    carbonStock = parseFloat((areaHectares * 2.7).toFixed(1));
  }

  // Biomass
  let biomass = baseline?.biomass ? parseFloat(baseline.biomass) : parseFloat((areaHectares * 1.7).toFixed(1));
  let sequestrationRate = baseline?.sequestrationRate ? parseFloat(baseline.sequestrationRate) : 3.4;

  const createdAt = p.createdAt ? new Date(p.createdAt) : new Date(Date.now() - 86400000);

  return {
    ...p,
    id,
    projectId: id,
    name,
    projectName: name,
    rawStatus,
    normStatus,
    statusConfig,
    plantationType,
    location,
    saplings,
    latitude: lat,
    longitude: lng,
    hasValidCoordinates,
    analysisRadius: radius,
    evidenceCount,
    imageUrl,
    areaHectares,
    carbonStock,
    biomass,
    sequestrationRate,
    baseline,
    mrvRecords,
    mrvStatus,
    createdAt,
    ngoId: p.ngoId || p.ngoName || 'NGO Partner',
  };
};

/**
 * Calculates platform summary statistics from explorer projects.
 *
 * @param {Array<object>} projects
 * @returns {object} Summary metrics
 */
export const getExplorerSummary = (projects = []) => {
  const total = projects.length;
  let totalArea = 0;
  let totalSaplings = 0;
  let totalCarbon = 0;
  let underVerification = 0;
  let approved = 0;
  let activeMRV = 0;

  projects.forEach((p) => {
    const norm = normalizeProjectForExplorer(p);
    if (!norm) return;

    totalArea += norm.areaHectares || 0;
    totalSaplings += norm.saplings || 0;
    totalCarbon += norm.carbonStock || 0;

    if (norm.normStatus === 'approved' || norm.normStatus === 'credit_issued') {
      approved += 1;
    } else if (norm.normStatus === 'under_verification' || norm.normStatus === 'submitted' || norm.normStatus === 'pending') {
      underVerification += 1;
    }

    if (norm.mrvStatus.key === 'monitoring_active' || norm.mrvStatus.key === 'verified') {
      activeMRV += 1;
    }
  });

  return {
    total,
    totalArea: Math.round(totalArea * 10) / 10,
    totalSaplings,
    totalCarbon: Math.round(totalCarbon * 10) / 10,
    underVerification,
    approved,
    activeMRV,
  };
};

/**
 * Filter projects based on user-selected criteria.
 *
 * @param {Array<object>} projects
 * @param {object} filters
 * @returns {Array<object>} Filtered projects
 */
export const filterExplorerProjects = (projects = [], filters = {}) => {
  const {
    searchQuery = '',
    status = 'all',
    ecosystem = 'all',
    mrvStatus = 'all',
    evidenceStatus = 'all',
    areaRange = 'all',
  } = filters;

  const query = searchQuery.trim().toLowerCase();

  return projects.filter((raw) => {
    const p = normalizeProjectForExplorer(raw);
    if (!p) return false;

    // 1. Search Query (Name, Location, Ecosystem, NGO)
    if (query) {
      const matchName = p.name.toLowerCase().includes(query);
      const matchLoc = p.location.toLowerCase().includes(query);
      const matchEco = p.plantationType.toLowerCase().includes(query);
      const matchNgo = p.ngoId.toLowerCase().includes(query);
      if (!matchName && !matchLoc && !matchEco && !matchNgo) {
        return false;
      }
    }

    // 2. Status Filter
    if (status !== 'all') {
      if (status === 'under_verification') {
        if (p.normStatus !== 'under_verification' && p.normStatus !== 'pending' && p.normStatus !== 'submitted') {
          return false;
        }
      } else if (p.normStatus !== status) {
        return false;
      }
    }

    // 3. Ecosystem Type Filter
    if (ecosystem !== 'all') {
      if (p.plantationType.toLowerCase() !== ecosystem.toLowerCase()) {
        return false;
      }
    }

    // 4. MRV Status Filter
    if (mrvStatus !== 'all') {
      if (p.mrvStatus.key !== mrvStatus) {
        return false;
      }
    }

    // 5. Evidence Status Filter
    if (evidenceStatus !== 'all') {
      if (evidenceStatus === 'has_evidence' && p.evidenceCount === 0) return false;
      if (evidenceStatus === 'no_evidence' && p.evidenceCount > 0) return false;
    }

    // 6. Project Area Range Filter
    if (areaRange !== 'all') {
      const area = p.areaHectares || 0;
      if (areaRange === 'small' && area >= 10) return false;
      if (areaRange === 'medium' && (area < 10 || area > 100)) return false;
      if (areaRange === 'large' && area <= 100) return false;
    }

    return true;
  });
};

/**
 * Sort projects by given sort key.
 *
 * @param {Array<object>} projects
 * @param {string} sortBy
 * @returns {Array<object>} Sorted projects
 */
export const sortExplorerProjects = (projects = [], sortBy = 'recent') => {
  const list = [...projects];

  return list.sort((aRaw, bRaw) => {
    const a = normalizeProjectForExplorer(aRaw);
    const b = normalizeProjectForExplorer(bRaw);
    if (!a || !b) return 0;

    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt) - new Date(a.createdAt);
      case 'oldest':
        return new Date(a.createdAt) - new Date(b.createdAt);
      case 'name_asc':
        return a.name.localeCompare(b.name);
      case 'name_desc':
        return b.name.localeCompare(a.name);
      case 'area_desc':
        return (b.areaHectares || 0) - (a.areaHectares || 0);
      case 'area_asc':
        return (a.areaHectares || 0) - (b.areaHectares || 0);
      case 'carbon_desc':
        return (b.carbonStock || 0) - (a.carbonStock || 0);
      default:
        return 0;
    }
  });
};
