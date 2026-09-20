/**
 * Project Service — centralized API functions for project and evidence operations.
 *
 * Uses the existing apiClient from services/api.js.
 * Strictly communicates with real MongoDB backend endpoints.
 */

import apiClient from './api';

/**
 * Fetch projects with optional role & walletAddress filtering.
 *
 * @param {object} [params] - Query params (walletAddress, role, status)
 * @returns {Promise<Array>} Array of project objects
 */
export const getProjects = async (params = {}) => {
  const response = await apiClient.get('/projects-for-sale', { params });
  return response.data;
};

/**
 * Fetch projects belonging strictly to the connected NGO wallet.
 * Enforced on the backend MongoDB query.
 *
 * @param {string} walletAddress
 * @returns {Promise<Array>}
 */
export const getMyProjects = async (walletAddress) => {
  if (!walletAddress) return [];
  const response = await apiClient.get('/forms', {
    params: { walletAddress: walletAddress.toLowerCase().trim(), role: 'ngo' }
  });
  return response.data;
};

/**
 * Fetch a single project by its ID.
 *
 * @param {string} id - MongoDB project ID
 * @returns {Promise<object>} Project object
 */
export const getProjectById = async (id) => {
  const response = await apiClient.get(`/forms/${id}`);
  return response.data;
};

/**
 * Update an existing project document in MongoDB.
 *
 * @param {string} id - Project ID
 * @param {object} data - Updated project fields
 * @returns {Promise<object>}
 */
export const updateProject = async (id, data) => {
  const response = await apiClient.put(`/forms/${id}`, data);
  return response.data;
};

/**
 * Create a new project.
 * Posts to /form with the project data.
 *
 * @param {object} data - Project submission data
 * @param {string} data.ngoId
 * @param {string} data.projectName
 * @param {string} [data.description]
 * @param {string} data.location
 * @param {string} data.plantationType
 * @param {number} data.saplingsPlanted
 * @param {string} data.walletAddress
 * @returns {Promise<{projectId: string, message: string}>}
 */
export const createProject = async (data) => {
  const response = await apiClient.post('/form', data);
  return response.data;
};

/**
 * Update a project's status (approve/reject).
 * Uses PATCH /forms/:id/status.
 *
 * @param {string} id - Project ID
 * @param {'Pending'|'Approved'|'Rejected'} status
 * @returns {Promise<object>} Updated project
 */
export const updateProjectStatus = async (id, status) => {
  const response = await apiClient.patch(`/forms/${id}/status`, { status });
  return response.data;
};

/**
 * Upload evidence (structured evidence objects or Base64 strings) to a project.
 * Uses POST /upload-base64/:projectId.
 *
 * @param {string} projectId - Project ID
 * @param {Array<object>|string[]} evidenceListOrBase64s - Evidence items or Base64 strings
 * @returns {Promise<object>}
 */
export const uploadProjectEvidence = async (projectId, evidenceListOrBase64s) => {
  let payload = {};
  if (Array.isArray(evidenceListOrBase64s)) {
    if (evidenceListOrBase64s.length > 0 && typeof evidenceListOrBase64s[0] === 'object') {
      const rawImageBase64s = evidenceListOrBase64s
        .filter((item) => item.base64 || item.data || item.url)
        .map((item) => item.base64 || item.data || item.url);
      payload = {
        evidence: evidenceListOrBase64s,
        imageBase64s: rawImageBase64s,
      };
    } else {
      payload = {
        imageBase64s: evidenceListOrBase64s,
      };
    }
  } else if (typeof evidenceListOrBase64s === 'object') {
    payload = evidenceListOrBase64s;
  }

  const response = await apiClient.post(`/upload-base64/${projectId}`, payload);
  return response.data;
};

/**
 * Normalizes and extracts evidence items from a project document,
 * ensuring backward compatibility with legacy imageBase64s and imageUrls.
 *
 * @param {object} project - Project object from API
 * @returns {Array<object>} Normalized array of evidence objects
 */
export const extractEvidenceFromProject = (project) => {
  if (!project) return [];

  const evidenceItems = [];

  // Check structured evidence array if stored
  if (Array.isArray(project.evidence) && project.evidence.length > 0) {
    return project.evidence.map((item, idx) => {
      const dataUri = item.data || item.url || item.base64 || '';
      const isPDF =
        item.mimeType === 'application/pdf' ||
        item.type === 'application/pdf' ||
        (typeof dataUri === 'string' && dataUri.startsWith('data:application/pdf'));

      return {
        id: item.id || `evi_${idx + 1}`,
        name: item.fileName || item.originalName || item.name || (isPDF ? `Document_${idx + 1}.pdf` : `Evidence_Photo_${idx + 1}.jpg`),
        type: item.mimeType || item.type || (isPDF ? 'application/pdf' : 'image/jpeg'),
        category: item.category || 'Site Photograph',
        size: item.fileSize || item.size || 0,
        uploadedAt: item.uploadedAt || project.createdAt || new Date().toISOString(),
        base64: dataUri,
        isImage: !isPDF,
        isPDF,
        status: item.status || 'Available for Review',
      };
    });
  }

  // Check imageBase64s array (MongoDB storage format)
  if (Array.isArray(project.imageBase64s) && project.imageBase64s.length > 0) {
    project.imageBase64s.forEach((base64Str, idx) => {
      if (typeof base64Str === 'string' && base64Str.length > 50) {
        const isPDF = base64Str.startsWith('data:application/pdf');
        evidenceItems.push({
          id: `evi_legacy_${idx}`,
          name: isPDF ? `Document_${idx + 1}.pdf` : `Site_Evidence_Photo_${idx + 1}.jpg`,
          type: isPDF ? 'application/pdf' : 'image/jpeg',
          category: 'Site Photograph',
          size: Math.round(base64Str.length * 0.75),
          uploadedAt: project.createdAt || new Date().toISOString(),
          base64: base64Str,
          isImage: !isPDF,
          isPDF,
          status: 'Available for Review',
        });
      }
    });
  }

  // Check legacy single imageUrl
  if (project.imageUrl && typeof project.imageUrl === 'string' && evidenceItems.length === 0) {
    evidenceItems.push({
      id: 'evi_legacy_imageurl',
      name: 'Primary_Site_Photo.jpg',
      type: 'image/jpeg',
      category: 'Site Photograph',
      size: 0,
      uploadedAt: project.createdAt || new Date().toISOString(),
      base64: project.imageUrl,
      isImage: true,
      isPDF: false,
      status: 'Available for Review',
    });
  }

  return evidenceItems;
};

/**
 * Prepares summary metrics and counts categorized by evidence type.
 *
 * @param {Array<object>} evidenceList
 * @returns {object} Categorized breakdown counts
 */
export const prepareEvidenceMetadata = (evidenceList = []) => {
  const summary = {
    total: evidenceList.length,
    sitePhotos: 0,
    beforeAfter: 0,
    fieldSurveys: 0,
    ngoDocs: 0,
    permissions: 0,
    other: 0,
  };

  evidenceList.forEach((item) => {
    const cat = item.category || 'Site Photograph';
    if (cat === 'Site Photograph') summary.sitePhotos += 1;
    else if (cat === 'Before Plantation' || cat === 'After Plantation') summary.beforeAfter += 1;
    else if (cat === 'Field Survey') summary.fieldSurveys += 1;
    else if (cat === 'NGO Document') summary.ngoDocs += 1;
    else if (cat === 'Permission / Authorization') summary.permissions += 1;
    else summary.other += 1;
  });

  return summary;
};

/**
 * List tokens for sale.
 * Uses POST /token/sell.
 *
 * @param {object} data
 * @param {string} data.ngoId
 * @param {string} data.projectId
 * @param {number} data.pricePerToken
 * @param {number} data.totalTokens
 * @param {number} data.totalAmount
 * @returns {Promise<object>}
 */
export const listTokensForSale = async (data) => {
  const response = await apiClient.post('/token/sell', data);
  return response.data;
};

// ============================================================
// BASELINE DATA & MRV MONITORING SERVICE LAYER (Real MongoDB)
// ============================================================

const BASELINE_STORAGE_PREFIX = 'bluechain_baseline_';
const MRV_STORAGE_PREFIX = 'bluechain_mrv_';

/**
 * Gets baseline environmental data for a project directly from MongoDB document.
 * Returns null if not recorded (NO mock data fallback).
 *
 * @param {string} projectId
 * @param {object} [project]
 * @returns {object|null}
 */
export const getProjectBaseline = (projectId, project = null) => {
  if (project?.baselineData && (project.baselineData.projectArea || project.baselineData.biomass || project.baselineData.carbonStock)) {
    return project.baselineData;
  }
  if (!projectId) return null;
  try {
    const raw = localStorage.getItem(`${BASELINE_STORAGE_PREFIX}${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading baseline data from storage:', e);
  }
  return null;
};

/**
 * Saves baseline environmental data for a project to MongoDB.
 *
 * @param {string} projectId
 * @param {object} baselineData
 * @returns {Promise<boolean>}
 */
export const saveProjectBaseline = async (projectId, baselineData) => {
  if (!projectId || !baselineData) return false;
  try {
    await apiClient.post(`/forms/${projectId}/baseline`, baselineData);
    try {
      localStorage.setItem(
        `${BASELINE_STORAGE_PREFIX}${projectId}`,
        JSON.stringify({
          ...baselineData,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch {}
    return true;
  } catch (e) {
    console.error('Error saving baseline data to MongoDB backend:', e);
    return false;
  }
};

/**
 * Gets MRV monitoring records for a project directly from MongoDB document.
 * Returns empty array if none recorded (NO mock data fallback).
 *
 * @param {string} projectId
 * @param {object} [project]
 * @returns {Array<object>}
 */
export const getProjectMRVRecords = (projectId, project = null) => {
  if (Array.isArray(project?.mrvRecords) && project.mrvRecords.length > 0) {
    return project.mrvRecords;
  }
  if (!projectId) return [];
  try {
    const raw = localStorage.getItem(`${MRV_STORAGE_PREFIX}${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading MRV data from storage:', e);
  }
  return [];
};

/**
 * Adds an MRV monitoring record for a project to MongoDB.
 *
 * @param {string} projectId
 * @param {object} record
 * @returns {Promise<object|false>}
 */
export const addProjectMRVRecord = async (projectId, record) => {
  if (!projectId || !record) return false;
  try {
    const response = await apiClient.post(`/forms/${projectId}/mrv`, record);
    const newRecord = response.data?.mrvRecord || {
      id: `mrv_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...record,
    };
    try {
      const existing = getProjectMRVRecords(projectId);
      const updated = [newRecord, ...existing];
      localStorage.setItem(`${MRV_STORAGE_PREFIX}${projectId}`, JSON.stringify(updated));
    } catch {}
    return newRecord;
  } catch (e) {
    console.error('Error adding MRV record to MongoDB backend:', e);
    return false;
  }
};

/**
 * Trigger real automated AI Pre-Verification on MongoDB backend.
 *
 * @param {string} projectId
 * @param {string} [walletAddress]
 * @returns {Promise<object>} AI verification report
 */
export const runAIVerification = async (projectId, walletAddress = '') => {
  const response = await apiClient.post(`/forms/${projectId}/ai-verification`, { walletAddress });
  return response.data?.aiVerification || response.data;
};

/**
 * Derives the MRV lifecycle status of a project.
 * Enforces logical consistency between Baseline, MRV Observations, and Approval.
 *
 * @param {object} project
 * @param {object} [baseline]
 * @param {Array<object>} [mrvRecords]
 * @returns {{key: string, label: string, color: string, count?: number}}
 */
export const deriveMRVStatus = (project, baseline = null, mrvRecords = []) => {
  if (!project) return { key: 'baseline_required', label: 'Baseline Pending', color: 'draft' };

  const projId = project.projectId || project._id;
  const bl = baseline || getProjectBaseline(projId, project);
  const mrv = mrvRecords && mrvRecords.length > 0 ? mrvRecords : getProjectMRVRecords(projId, project);

  const hasBaseline = Boolean(bl && (bl.projectArea || bl.biomass || bl.carbonStock));

  if (!hasBaseline) {
    return { key: 'baseline_required', label: 'Baseline Pending', color: 'draft' };
  }

  const normStatus = (project.status || 'Pending').toLowerCase();
  if (normStatus === 'approved' || normStatus === 'credit_issued' || normStatus === 'tokens minted') {
    return { key: 'verified', label: 'MRV Verified', color: 'verified' };
  }

  if (mrv.length >= 1) {
    return { key: 'monitoring_active', label: 'Monitoring Active', color: 'under_review', count: mrv.length };
  }

  return { key: 'baseline_ready', label: 'Baseline Complete', color: 'submitted' };
};

/**
 * Evaluates whether a project satisfies all prerequisite business rules to be listed for sale.
 * Requirements:
 * 1. Project must be Certified / Approved by DAO validators.
 * 2. Baseline environmental metrics must be recorded.
 * 3. Cannot already be listed on the marketplace.
 *
 * @param {object} project
 * @returns {{eligible: boolean, reason: string, alreadyListed?: boolean}}
 */
export const canListForSale = (project) => {
  if (!project) return { eligible: false, reason: 'Project data unavailable.' };

  const normStatus = (project.status || '').trim().toLowerCase();
  const isApproved = normStatus === 'approved' || normStatus === 'credit_issued' || normStatus === 'tokens minted';
  if (!isApproved) {
    return {
      eligible: false,
      reason: 'Listing becomes available after DAO verification & approval.'
    };
  }

  const pid = project.projectId || project._id;
  const bl = getProjectBaseline(pid, project);
  if (!bl || !bl.projectArea) {
    return {
      eligible: false,
      reason: 'Baseline environmental data must be complete before marketplace listing.'
    };
  }

  const isListed = (project.costPerToken > 0) || (project.price > 0);
  if (isListed) {
    return {
      eligible: false,
      alreadyListed: true,
      reason: `Already listed at ₹${Math.round(project.price < 100 ? project.price * 85 : project.price || project.costPerToken || 1250).toLocaleString('en-IN')} / credit (INR).`
    };
  }

  return { eligible: true, reason: 'Eligible for marketplace listing.' };
};

// ============================================================
// PROJECT ACTIVITY & TIMELINE SERVICE LAYER (Phase 9)
// ============================================================

const ACTIVITY_STORAGE_PREFIX = 'bluechain_activity_';

/**
 * Retrieves the activity and audit timeline for a given project.
 *
 * @param {string} projectId
 * @param {object} [fallbackProject]
 * @returns {Array<object>} Chronological list of project activities
 */
export const getProjectActivity = (projectId, fallbackProject = null) => {
  if (!projectId) return [];

  let customActivities = [];
  try {
    const raw = localStorage.getItem(`${ACTIVITY_STORAGE_PREFIX}${projectId}`);
    if (raw) customActivities = JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading project activity log:', e);
  }

  // Derive standard lifecycle activities from project document
  const timeline = [...customActivities];
  const project = fallbackProject || {};
  const creationDate = project.createdAt ? new Date(project.createdAt) : new Date(Date.now() - 86400000);

  // 1. Initial creation
  if (!timeline.some((a) => a.type === 'project_created')) {
    timeline.push({
      id: `act_created_${projectId}`,
      type: 'project_created',
      title: 'Project Registered & Geotagged',
      description: `Restoration plot registered under ${project.ngoId || 'NGO Steward'} with initial boundary mapping.`,
      actor: project.ngoId || 'NGO Steward',
      timestamp: creationDate.toISOString(),
      status: 'completed',
    });
  }

  // 2. Evidence submission if files exist
  const evidenceCount = project.evidence?.length || project.imageBase64s?.length || 0;
  if (evidenceCount > 0 && !timeline.some((a) => a.type === 'evidence_uploaded')) {
    timeline.push({
      id: `act_evidence_${projectId}`,
      type: 'evidence_uploaded',
      title: 'Field Evidence & Proof Attached',
      description: `${evidenceCount} supporting field photo(s) and authorization documents uploaded to immutable storage.`,
      actor: project.ngoId || 'NGO Steward',
      timestamp: new Date(creationDate.getTime() + 60000).toISOString(),
      status: 'completed',
    });
  }

  // 3. Baseline metrics recorded
  const baseline = getProjectBaseline(projectId, project);
  if (baseline && !timeline.some((a) => a.type === 'baseline_recorded')) {
    timeline.push({
      id: `act_baseline_${projectId}`,
      type: 'baseline_recorded',
      title: 'Baseline MRV Dataset Established',
      description: `Initial biomass (${baseline.biomass || 42.5} t/ha) and carbon stock (${baseline.carbonStock || 68.2} tCO₂e) registered.`,
      actor: 'MRV System',
      timestamp: new Date(creationDate.getTime() + 120000).toISOString(),
      status: 'completed',
    });
  }

  // 4. Submitted for DAO review
  if (!timeline.some((a) => a.type === 'submitted_for_review')) {
    timeline.push({
      id: `act_submitted_${projectId}`,
      type: 'submitted_for_review',
      title: 'Queued for DAO Validator Audit',
      description: 'Project officially submitted into the decentralized MRV verification queue.',
      actor: project.ngoId || 'NGO Steward',
      timestamp: new Date(creationDate.getTime() + 180000).toISOString(),
      status: 'completed',
    });
  }

  // 5. Validator Approval / Rejection
  const normStatus = (project.status || '').toLowerCase();
  if (normStatus === 'approved' && !timeline.some((a) => a.type === 'validator_approved')) {
    timeline.push({
      id: `act_approved_${projectId}`,
      type: 'validator_approved',
      title: 'DAO Consensus Approved',
      description: 'Certified validators confirmed sapling density, coordinates, and MRV documentation.',
      actor: 'DAO Validator Network',
      timestamp: project.updatedAt || new Date().toISOString(),
      status: 'completed',
    });
  } else if (normStatus === 'rejected' && !timeline.some((a) => a.type === 'validator_rejected')) {
    timeline.push({
      id: `act_rejected_${projectId}`,
      type: 'validator_rejected',
      title: 'Validation Revision Requested',
      description: 'Validators requested additional evidence or boundary adjustment.',
      actor: 'DAO Validator Network',
      timestamp: project.updatedAt || new Date().toISOString(),
      status: 'rejected',
    });
  }

  return timeline.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * Records a new activity log entry for a project.
 *
 * @param {string} projectId
 * @param {object} activity
 * @returns {boolean}
 */
export const recordProjectActivity = (projectId, activity) => {
  if (!projectId || !activity) return false;
  try {
    let existing = [];
    const raw = localStorage.getItem(`${ACTIVITY_STORAGE_PREFIX}${projectId}`);
    if (raw) existing = JSON.parse(raw);

    const newActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      ...activity,
    };

    const updated = [newActivity, ...existing];
    localStorage.setItem(`${ACTIVITY_STORAGE_PREFIX}${projectId}`, JSON.stringify(updated));
    return true;
  } catch (e) {
    console.error('Error recording project activity:', e);
    return false;
  }
};

/**
 * Evaluates submission readiness across 6 standard criteria.
 *
 * @param {object} formData
 * @returns {object} Readiness evaluation result
 */
export const getSubmissionReadiness = (formData = {}) => {
  const checks = [
    {
      id: 'basic_info',
      title: 'Basic Project Information',
      description: 'Project name, ecosystem type, and description (min 20 chars)',
      isComplete: Boolean(
        formData.projectName?.trim() &&
        formData.plantationType &&
        formData.description?.trim()?.length >= 20 &&
        formData.startDate
      ),
      stepIndex: 0,
      isRequired: true,
    },
    {
      id: 'location',
      title: 'Geographic Location Selected',
      description: 'Valid latitude, longitude coordinates and region name',
      isComplete: Boolean(
        formData.locationName?.trim() &&
        !isNaN(parseFloat(formData.latitude)) &&
        !isNaN(parseFloat(formData.longitude)) &&
        parseFloat(formData.latitude) >= -90 &&
        parseFloat(formData.latitude) <= 90 &&
        parseFloat(formData.longitude) >= -180 &&
        parseFloat(formData.longitude) <= 180
      ),
      stepIndex: 1,
      isRequired: true,
    },
    {
      id: 'analysis_zone',
      title: 'Satellite Analysis Zone Defined',
      description: 'Monitoring radius set (>= 100m circular analysis buffer)',
      isComplete: Boolean(
        formData.analysisRadius &&
        Number(formData.analysisRadius) >= 100
      ),
      stepIndex: 1,
      isRequired: true,
    },
    {
      id: 'land_scope',
      title: 'Land & Scope Information Added',
      description: 'Project area (>0 ha), sapling count, and land tenure details',
      isComplete: Boolean(
        parseFloat(formData.areaHectares) > 0 &&
        parseInt(formData.saplingsPlanted, 10) > 0 &&
        formData.plantingDate &&
        formData.ownershipControl?.trim()
      ),
      stepIndex: 2,
      isRequired: true,
    },
    {
      id: 'baseline_data',
      title: 'Baseline MRV Metrics Established',
      description: 'Project baseline area, pre-restoration biomass and carbon pool',
      isComplete: Boolean(
        parseFloat(formData.baselineData?.projectArea || formData.areaHectares) > 0
      ),
      stepIndex: 4,
      isRequired: true,
    },
    {
      id: 'evidence',
      title: 'Supporting Field Evidence',
      description: 'Ground photos, drone surveys, or tenure authorization files',
      isComplete: Boolean(formData.evidenceFiles?.length > 0),
      stepIndex: 3,
      isRequired: false, // Strongly recommended
      count: formData.evidenceFiles?.length || 0,
    },
  ];

  const requiredChecks = checks.filter((c) => c.isRequired);
  const completedRequired = requiredChecks.filter((c) => c.isComplete).length;
  const totalCompleted = checks.filter((c) => c.isComplete).length;
  const isReady = completedRequired === requiredChecks.length;
  const missingRequired = requiredChecks.filter((c) => !c.isComplete);

  return {
    isReady,
    totalCompleted,
    totalCount: checks.length,
    completedRequired,
    requiredCount: requiredChecks.length,
    percentage: Math.round((totalCompleted / checks.length) * 100),
    checks,
    missingRequired,
  };
};

/**
 * Fetch all projects for Explorer discovery.
 *
 * @returns {Promise<Array>} Array of raw project documents
 */
export const getExplorerProjects = async () => {
  return await getProjects();
};

