/**
 * Project Status Configuration & Lifecycle State Machine
 * Central single-source-of-truth for the 6-stage project lifecycle in BlueChain MRV.
 *
 * 6 Canonical Stages:
 * 1. DRAFT
 * 2. SUBMITTED
 * 3. AI_PRE_VERIFICATION
 * 4. VALIDATOR_REVIEW
 * 5. DAO_REVIEW
 * 6. CREDIT_ISSUED
 */

export const LIFECYCLE_STAGES = [
  { id: 'draft', label: 'Draft', description: 'Information entry', stageIndex: 0 },
  { id: 'submitted', label: 'Submitted', description: 'Queued for AI check', stageIndex: 1 },
  { id: 'ai_pre_verification', label: 'AI Pre-Verification', description: 'Automated screening', stageIndex: 2 },
  { id: 'validator_review', label: 'Satellite ML Audit', description: 'Sentinel-2 GEE audit & vote', stageIndex: 3 },
  { id: 'dao_review', label: 'DAO Consensus', description: 'Governance voting', stageIndex: 4 },
  { id: 'credit_issued', label: 'Credit Issued', description: 'Tokens minted', stageIndex: 5 },
];

export const PROJECT_STATUS_CONFIG = {
  // STAGE 1: DRAFT
  draft: {
    key: 'draft',
    label: 'Draft',
    badgeVariant: 'draft',
    color: '#5f6368',
    bgColor: '#f1f3f4',
    borderColor: '#dadce0',
    stageIndex: 0,
    stageId: 'draft',
    stageName: 'Draft',
    isRevision: false,
    description: 'Project information is being prepared and has not yet been submitted to the network.',
    nextAction: 'Complete required project details and submit for automated AI pre-verification.',
  },

  // STAGE 2: SUBMITTED (AI PENDING / RUNNING)
  submitted: {
    key: 'submitted',
    label: 'Submitted (AI Pending)',
    badgeVariant: 'submitted',
    color: '#1a73e8',
    bgColor: '#e8f0fe',
    borderColor: 'rgba(26, 115, 232, 0.25)',
    stageIndex: 1,
    stageId: 'submitted',
    stageName: 'Submitted',
    isRevision: false,
    description: 'Project has been submitted to MongoDB and is queued for automated AI pre-verification screening.',
    nextAction: 'Start AI Pre-Verification screening to analyze coordinates, evidence, and baseline data.',
  },
  ai_pending: {
    key: 'ai_pending',
    label: 'AI Pre-Verification Pending',
    badgeVariant: 'submitted',
    color: '#1a73e8',
    bgColor: '#e8f0fe',
    borderColor: 'rgba(26, 115, 232, 0.25)',
    stageIndex: 1,
    stageId: 'submitted',
    stageName: 'AI Pending',
    isRevision: false,
    description: 'Project is waiting for automated AI screening to evaluate data integrity.',
    nextAction: 'Execute AI Pre-Verification screening.',
  },
  ai_in_progress: {
    key: 'ai_in_progress',
    label: 'AI Screening in Progress',
    badgeVariant: 'under_review',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: 'rgba(2, 132, 199, 0.25)',
    stageIndex: 1,
    stageId: 'submitted',
    stageName: 'AI Processing',
    isRevision: false,
    description: 'AI Pre-Verification Agent is currently auditing project completeness, geospatial zones, and density.',
    nextAction: 'Analysis in progress; please wait for screening results.',
  },

  // STAGE 3: AI PRE-VERIFICATION RESULTS
  ai_requires_changes: {
    key: 'ai_requires_changes',
    label: 'AI Revision Required',
    badgeVariant: 'rejected',
    color: '#c5221f',
    bgColor: '#fce8e6',
    borderColor: 'rgba(217, 48, 37, 0.3)',
    stageIndex: 2,
    stageId: 'ai_pre_verification',
    stageName: 'AI Flagged',
    isRevision: true,
    description: 'AI Pre-Verification detected critical issues or missing data that require correction before proceeding.',
    nextAction: 'Click "Fix Issues & Resubmit" to update the flagged categories, then re-run AI verification.',
  },
  ai_passed: {
    key: 'ai_passed',
    label: 'AI Passed (Pending Review)',
    badgeVariant: 'approved',
    color: '#0d652d',
    bgColor: '#e6f4ea',
    borderColor: 'rgba(52, 168, 83, 0.25)',
    stageIndex: 2,
    stageId: 'ai_pre_verification',
    stageName: 'AI Passed',
    isRevision: false,
    description: 'Passed automated AI pre-verification screening. Submission is eligible for certified DAO validator review.',
    nextAction: 'Queued for certified DAO validator inspection and review.',
  },

  // STAGE 4: SATELLITE ML AUDIT & VALIDATOR REVIEW
  validator_pending: {
    key: 'validator_pending',
    label: 'Pending Satellite ML Audit',
    badgeVariant: 'pending',
    color: '#b06000',
    bgColor: '#fef7e0',
    borderColor: 'rgba(251, 188, 5, 0.3)',
    stageIndex: 3,
    stageId: 'validator_review',
    stageName: 'Satellite ML Audit',
    isRevision: false,
    description: 'Project is queued for Sentinel-2 GEE ML canopy audit and validator consensus review.',
    nextAction: 'DAO Validators audit Sentinel-2 satellite ground-truth, detected canopy hectares, and cast consensus vote.',
  },
  under_verification: {
    key: 'under_verification',
    label: 'Under Satellite ML Audit',
    badgeVariant: 'under_review',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: 'rgba(2, 132, 199, 0.25)',
    stageIndex: 3,
    stageId: 'validator_review',
    stageName: 'Satellite ML Audit',
    isRevision: false,
    description: 'DAO Validators are actively evaluating Sentinel-2 satellite imagery, temporal NDVI trends, and ground photos.',
    nextAction: 'Active Sentinel-2 satellite inspection and consensus voting in progress.',
  },
  validator_rejected: {
    key: 'validator_rejected',
    label: 'Validator Revision Req.',
    badgeVariant: 'rejected',
    color: '#c5221f',
    bgColor: '#fce8e6',
    borderColor: 'rgba(217, 48, 37, 0.3)',
    stageIndex: 3,
    stageId: 'validator_review',
    stageName: 'Validator Rejected',
    isRevision: true,
    description: 'Validator requested revisions based on evidence or field data discrepancies.',
    nextAction: 'Review validator comments, update required project fields, and resubmit.',
  },
  validator_approved: {
    key: 'validator_approved',
    label: 'Validator Approved',
    badgeVariant: 'approved',
    color: '#0d652d',
    bgColor: '#e6f4ea',
    borderColor: 'rgba(52, 168, 83, 0.25)',
    stageIndex: 4,
    stageId: 'dao_review',
    stageName: 'Validator Approved',
    isRevision: false,
    description: 'Validator audit complete and approved. Project advanced to DAO governance consensus voting.',
    nextAction: 'DAO governance council voting in progress.',
  },

  // STAGE 5: DAO REVIEW & GOVERNANCE
  dao_review: {
    key: 'dao_review',
    label: 'DAO Consensus Review',
    badgeVariant: 'under_review',
    color: '#7c3aed',
    bgColor: '#f3e8ff',
    borderColor: 'rgba(124, 58, 237, 0.25)',
    stageIndex: 4,
    stageId: 'dao_review',
    stageName: 'DAO Review',
    isRevision: false,
    description: 'Project is undergoing multi-stakeholder DAO governance voting and consensus validation.',
    nextAction: 'Governance consensus threshold tally in progress.',
  },
  dao_rejected: {
    key: 'dao_rejected',
    label: 'DAO Vote Rejected',
    badgeVariant: 'rejected',
    color: '#c5221f',
    bgColor: '#fce8e6',
    borderColor: 'rgba(217, 48, 37, 0.3)',
    stageIndex: 4,
    stageId: 'dao_review',
    stageName: 'DAO Rejected',
    isRevision: true,
    description: 'DAO governance vote did not reach approval consensus.',
    nextAction: 'Review governance feedback, modify proposal parameters, and resubmit.',
  },
  approved: {
    key: 'approved',
    label: 'Approved (Ready to Mint)',
    badgeVariant: 'approved',
    color: '#137333',
    bgColor: '#e6f4ea',
    borderColor: 'rgba(52, 168, 83, 0.25)',
    stageIndex: 4,
    stageId: 'dao_review',
    stageName: 'Approved',
    isRevision: false,
    description: 'The project has received full DAO approval and is certified for on-chain carbon credit issuance.',
    nextAction: 'Ready for admin to trigger on-chain BCT carbon credit minting to NGO steward wallet.',
  },
  dao_approved: {
    key: 'dao_approved',
    label: 'DAO Approved',
    badgeVariant: 'approved',
    color: '#137333',
    bgColor: '#e6f4ea',
    borderColor: 'rgba(52, 168, 83, 0.25)',
    stageIndex: 4,
    stageId: 'dao_review',
    stageName: 'DAO Approved',
    isRevision: false,
    description: 'Full DAO approval achieved. Ready for smart contract minting.',
    nextAction: 'Ready for carbon credit token minting.',
  },

  // STAGE 6: CREDIT ISSUED (TOKENS MINTED)
  credit_issued: {
    key: 'credit_issued',
    label: 'Credits Issued (BCT Minted)',
    badgeVariant: 'verified',
    color: '#0d652d',
    bgColor: '#ceead6',
    borderColor: 'rgba(19, 115, 51, 0.3)',
    stageIndex: 5,
    stageId: 'credit_issued',
    stageName: 'Credit Issued',
    isRevision: false,
    description: 'BCT ERC-20 carbon tokens have been minted on Sepolia and deposited into the NGO steward wallet.',
    nextAction: 'Credits are live on the decentralized Blue Carbon Marketplace for trading or retirement.',
  },
};

/**
 * Normalizes raw project status strings into a standard configuration key.
 * Safely handles both string statuses and full project document objects.
 *
 * @param {string|object} statusOrProject
 * @returns {string} Canonical status key
 */
export const normalizeStatus = (statusOrProject) => {
  if (!statusOrProject) return 'submitted';

  let raw = '';
  if (typeof statusOrProject === 'string') {
    raw = statusOrProject.trim().toLowerCase();
  } else if (typeof statusOrProject === 'object') {
    if (statusOrProject.blockchainTx || (statusOrProject.tokensMinted && statusOrProject.tokensMinted > 0)) {
      return 'credit_issued';
    }
    raw = (statusOrProject.status || '').trim().toLowerCase();
  }

  // Credit Issued
  if (raw === 'credit_issued' || raw === 'tokens minted' || raw === 'tokens_minted' || raw === 'minted') {
    return 'credit_issued';
  }

  // DAO / Approved
  if (raw === 'approved' || raw === 'dao_approved' || raw === 'dao approved') {
    return 'approved';
  }
  if (raw === 'dao_review' || raw === 'dao review' || raw === 'governance') {
    return 'dao_review';
  }
  if (raw === 'dao_rejected' || raw === 'dao rejected') {
    return 'dao_rejected';
  }

  // Validator Review
  if (raw === 'validator_approved' || raw === 'validator approved') {
    return 'validator_approved';
  }
  if (raw === 'validator_rejected' || raw === 'rejected' || raw === 'disapproved') {
    return 'validator_rejected';
  }
  if (raw === 'under_verification' || raw === 'under review' || raw === 'under_review' || raw === 'verifying') {
    return 'under_verification';
  }
  if (raw === 'validator_pending' || raw === 'pending' || raw === 'pending review' || raw === 'pending_review') {
    return 'validator_pending';
  }

  // AI Pre-Verification
  if (raw === 'ai_requires_changes' || raw === 'ai_flagged' || raw === 'ai_failed' || raw === 'ai flagged' || raw === 'ai failed' || raw === 'needs_information' || raw === 'needs information') {
    return 'ai_requires_changes';
  }
  if (raw === 'ai_passed' || raw === 'ai passed' || raw === 'passed_for_human_review' || raw === 'flagged_for_manual_review') {
    return 'ai_passed';
  }
  if (raw === 'ai_in_progress' || raw === 'ai processing' || raw === 'ai_processing' || raw === 'processing') {
    return 'ai_in_progress';
  }
  if (raw === 'ai_pending' || raw === 'ai pending' || raw === 'ai_verification' || raw === 'not_requested' || raw === 'not requested') {
    return 'ai_pending';
  }

  // Submitted & Draft
  if (raw === 'draft') {
    return 'draft';
  }
  if (raw === 'submitted' || raw === 'queued') {
    return 'submitted';
  }

  return 'submitted';
};

/**
 * Returns the status configuration object for a project or status string.
 *
 * @param {string|object} statusOrProject
 * @returns {object} Full status configuration
 */
export const getStatusConfig = (statusOrProject) => {
  const key = normalizeStatus(statusOrProject);
  return PROJECT_STATUS_CONFIG[key] || PROJECT_STATUS_CONFIG.submitted;
};

/**
 * Returns structured 6-stage lifecycle progression indicating state of each stage.
 *
 * @param {string|object} statusOrProject
 * @returns {Array<object>} Ordered 6 lifecycle stages with exact state
 */
export const getLifecycleStages = (statusOrProject) => {
  const norm = normalizeStatus(statusOrProject);
  const config = getStatusConfig(norm);
  const currentIndex = config.stageIndex;
  const isRevision = Boolean(config.isRevision);

  return LIFECYCLE_STAGES.map((st, idx) => {
    let state = 'upcoming';

    if (idx < currentIndex) {
      state = 'completed';
    } else if (idx === currentIndex) {
      state = isRevision ? 'rejected' : (idx === 5 && norm === 'credit_issued' ? 'completed' : 'current');
    }

    return {
      ...st,
      state,
      isRevision: idx === currentIndex && isRevision,
    };
  });
};

/**
 * Returns permissible actions and button states for a project based on user role and project status.
 *
 * @param {object} project
 * @param {string} role
 * @param {string} userAddress
 * @returns {object} Permissions and available actions
 */
export const getAvailableActions = (project, role = '', userAddress = '') => {
  if (!project) return {};

  const norm = normalizeStatus(project);
  const isOwner = userAddress && project.walletAddress &&
    userAddress.toLowerCase().trim() === project.walletAddress.toLowerCase().trim();

  const isNGO = role === 'ngo' || role === 'NGO';
  const isValidator = role === 'validator' || role === 'VALIDATOR' || role === 'admin' || role === 'ADMIN';
  const isAdmin = role === 'admin' || role === 'ADMIN';
  const isInvestor = role === 'investor' || role === 'INVESTOR';

  return {
    canStartAI: (isNGO || isValidator || isAdmin) && (norm === 'submitted' || norm === 'ai_pending'),
    canRerunAI: (isNGO || isValidator || isAdmin) && (norm === 'ai_requires_changes' || norm === 'ai_passed' || norm === 'validator_pending'),
    canFixAndResubmit: isNGO && isOwner && (norm === 'ai_requires_changes' || norm === 'validator_rejected' || norm === 'dao_rejected'),
    canValidatorReview: isValidator && (norm === 'validator_pending' || norm === 'under_verification' || norm === 'ai_passed'),
    canVoteApprove: isValidator && (norm === 'validator_pending' || norm === 'under_verification' || norm === 'ai_passed'),
    canVoteReject: isValidator && (norm === 'validator_pending' || norm === 'under_verification' || norm === 'ai_passed'),
    canMintCredits: isAdmin && (norm === 'approved' || norm === 'dao_approved' || norm === 'validator_approved'),
    canListForSale: isNGO && isOwner && norm === 'credit_issued',
    canBuyTokens: isInvestor && norm === 'credit_issued' && project.price > 0,
  };
};

/**
 * Formats a clean human-readable Project Identifier (e.g. BC-6A8FF00A).
 *
 * @param {string} rawId
 * @returns {string}
 */
export const formatProjectId = (rawId) => {
  if (!rawId) return 'BC-PENDING';
  const str = String(rawId).replace(/[^a-zA-Z0-9]/g, '');
  if (str.length <= 8) return `BC-${str.toUpperCase()}`;
  return `BC-${str.slice(-8).toUpperCase()}`;
};
