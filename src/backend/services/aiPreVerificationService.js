/**
 * Master AI Pre-Verification Service (Phase 11 Real Verification Engine) — BlueChain
 *
 * Implements the 5 core investigation dimensions:
 * A. Land & Authorization Evidence (Gemini Semantic Analysis + Tesseract OCR)
 * B. NGO / Document Authenticity & Identity Consistency
 * C. Geographic Location Consistency (Document text/coords vs GPS & Analysis Buffer)
 * D. Real Copernicus Sentinel-2 Satellite Analysis (Real NDVI / EVI / Cloud Filter)
 * E. Mangrove Biophysical Plausibility & Anomaly Detection (Growth ceilings & Silvicultural Density)
 *
 * Grounded in:
 * - NO MOCK DATA
 * - Real API integrations
 * - Actionable "Action Required" items for NEEDS_INFORMATION
 * - Single source of truth state machine
 */

const { v4: uuidv4 } = require("uuid");
const { analyzeProjectEvidenceDocuments } = require("./documentAnalysisService");
const { matchLocationConsistency } = require("./locationMatchingService");
const { analyzeProjectAuthenticity } = require("./projectAuthenticityService");
const { analyzeGeographicPlausibility } = require("./geographicPlausibilityService");
const { analyzeEvidenceAuthenticity } = require("./evidenceAuthenticityService");
const { verifySatelliteData } = require("./satelliteVerificationService");
const { analyzeEnvironmentalAnomalies } = require("./environmentalAnomalyService");
const { estimateBiomassFromAllometry } = require("./biomassEstimationService");
const { calculateCarbonStockAndCO2e } = require("./carbonCalculationService");

const ENGINE_VERSION = "3.0.0-real-copernicus-gemini-engine";

/**
 * Standard AI Pre-Verification States
 */
const AI_STATES = {
  NOT_REQUESTED: "NOT_REQUESTED",
  PROCESSING: "PROCESSING",
  PASSED_FOR_HUMAN_REVIEW: "PASSED_FOR_HUMAN_REVIEW",
  NEEDS_INFORMATION: "NEEDS_INFORMATION",
  FLAGGED_FOR_MANUAL_REVIEW: "FLAGGED_FOR_MANUAL_REVIEW",
  FAILED: "FAILED",
  STALE: "STALE"
};

/**
 * Runs the complete real AI Pre-Verification pipeline for a project document.
 *
 * @param {object} project - Target project document from MongoDB
 * @param {Array<object>} [allProjects=[]] - All projects in MongoDB for cross-reference
 * @param {number} [runNumber=1] - Sequential run index
 * @returns {Promise<object>} Unified AI Pre-Verification Report
 */
async function executePreVerificationPipeline(project, allProjects = [], runNumber = 1) {
  const verificationId = `VER-${Date.now().toString(36).toUpperCase()}-${uuidv4().slice(0, 6)}`;
  const startedAt = new Date();
  const requestedAt = project.aiVerification?.requestedAt || startedAt;

  // 1. Evidence Authenticity & Cryptographic SHA-256 Hashing
  const evidenceCryptoResult = analyzeEvidenceAuthenticity(project, allProjects);

  // 2. Gemini & OCR Document Intelligence on Uploaded Files
  const documentReports = await analyzeProjectEvidenceDocuments(project);

  // 3. Location Matching & Geographic Consistency
  const locationMatchResult = matchLocationConsistency(project, documentReports);

  // 4. Cross-Project Spatial Overlap / Collision Check
  const authenticityResult = analyzeProjectAuthenticity(project, allProjects);

  // 5. Geographic Bounding & Latitudinal Plausibility
  const geographicResult = analyzeGeographicPlausibility(project);

  // 6. Real Copernicus / Sentinel-2 Satellite Environmental Verification
  const satelliteResult = await verifySatelliteData(project);

  // 7. Biophysical Anomaly & Mangrove Growth Detection
  const anomalyResult = analyzeEnvironmentalAnomalies(project);

  // 8. Biomass Allometry & Carbon Accounting
  const baseline = project.baselineData || {};
  const biomassResult = estimateBiomassFromAllometry({
    species: project.plantationType || "Generic Mangrove",
    areaHectares: parseFloat(project.areaHectares) || 1,
    saplingsPlanted: parseInt(project.saplingsPlanted || 0, 10),
    declaredBiomass: baseline.biomass
  });

  const carbonResult = calculateCarbonStockAndCO2e({
    biomassTonnesPerHa: biomassResult.outputs?.biomassDensityTonnesPerHa || baseline.biomass,
    areaHectares: parseFloat(project.areaHectares) || 1,
    soilCarbonTonnesPerHa: baseline.soilCarbon || 0
  });

  // Evaluate Land & Authorization Evidence Summary
  let landAuthorizationStatus = "INSUFFICIENT_EVIDENCE";
  const landFindings = [];
  const landWarnings = [];
  const actionRequiredList = [];

  const landDocs = documentReports.filter(
    (d) => d.category === "land_authorization" || d.documentType?.toLowerCase().includes("land") || d.authorizationEvidence
  );

  if (landDocs.length > 0) {
    const hasExplicitAuth = landDocs.some(
      (d) => d.authorizationEvidence && !d.authorizationEvidence.toLowerCase().includes("unavailable")
    );
    if (hasExplicitAuth) {
      landAuthorizationStatus = "SUPPORTED";
      landFindings.push("Document demonstrates explicit land stewardship or government authorization.");
    } else {
      landAuthorizationStatus = "PARTIALLY_SUPPORTED";
      landWarnings.push("Uploaded document contains land references, but explicit stewardship permission text is unclear.");
    }
  } else {
    landAuthorizationStatus = "INSUFFICIENT_EVIDENCE";
    actionRequiredList.push({
      issueTitle: "Land authorization evidence is insufficient",
      whyItMatters: "Proof of land stewardship, government concession, or community consent is mandatory for certified blue carbon credits.",
      requiredAction: "Upload official land title, government permission letter, or community stewardship agreement.",
      targetStep: 5,
      targetSection: "evidence_upload"
    });
  }

  // Evaluate NGO Name / Profile Consistency
  const ngoFindings = [];
  const ngoWarnings = [];
  const submittingNgo = (project.ngoId || "").toLowerCase();

  documentReports.forEach((doc) => {
    if (doc.organizationName && submittingNgo) {
      const docOrg = doc.organizationName.toLowerCase();
      if (docOrg.includes(submittingNgo) || submittingNgo.includes(docOrg)) {
        ngoFindings.push(`Organization Name Matched: Document confirms '${doc.organizationName}' alignment with submitting NGO.`);
      } else {
        ngoWarnings.push(`Organization Name Inconsistency: Document lists '${doc.organizationName}', differing from submitting NGO ID '${project.ngoId}'.`);
      }
    }
  });

  // Check for Location Mismatch Actions
  if (locationMatchResult.status === "POTENTIAL_INCONSISTENCY") {
    actionRequiredList.push({
      issueTitle: "Project location does not match evidence documents",
      whyItMatters: "Coordinates or regional names in uploaded documents conflict with submitted project coordinates.",
      requiredAction: "Review project coordinates in Location Picker or upload updated survey records.",
      targetStep: 2,
      targetSection: "location_picker"
    });
  }

  // Aggregate All Risk Flags & Limitations
  const allRiskFlags = [
    ...locationMatchResult.riskFlags,
    ...evidenceCryptoResult.criticalIssues,
    ...authenticityResult.criticalIssues,
    ...geographicResult.criticalIssues,
    ...anomalyResult.criticalIssues
  ];

  const allLimitations = [
    "Satellite imagery cannot prove that a specific NGO planted a specific mangrove; it confirms spectral presence and vegetation density across the analysis zone.",
    "AI pre-screening evaluates evidence consistency and anomalies, but cannot legally certify official land ownership.",
    "Final project approval and credit certification authority remains strictly with certified Human Validators and the DAO."
  ];

  // Determine Overall AI State
  let aiState = AI_STATES.PASSED_FOR_HUMAN_REVIEW;
  let overallRecommendation = "PASSED_FOR_HUMAN_REVIEW";
  let recommendationLabel = "PASSED FOR HUMAN VALIDATOR REVIEW";
  let recommendationMessage = "Automated authenticity, geographic consistency, SHA-256 evidence integrity, and biophysical screenings completed successfully.";

  const hasCriticalCollisions = authenticityResult.status === "FAIL" || evidenceCryptoResult.status === "FAIL" || anomalyResult.status === "FAIL";
  const hasLocationMismatch = locationMatchResult.status === "POTENTIAL_INCONSISTENCY";
  const hasInsufficientDocs = landAuthorizationStatus === "INSUFFICIENT_EVIDENCE";

  if (hasCriticalCollisions || hasLocationMismatch) {
    aiState = AI_STATES.FLAGGED_FOR_MANUAL_REVIEW;
    overallRecommendation = "FLAGGED_FOR_MANUAL_REVIEW";
    recommendationLabel = "FLAGGED FOR ENHANCED MANUAL REVIEW";
    recommendationMessage = "Significant document inconsistency, cross-project overlap, or geographic collision identified. Placed in validator flagged queue.";
  } else if (hasInsufficientDocs || actionRequiredList.length > 0) {
    aiState = AI_STATES.NEEDS_INFORMATION;
    overallRecommendation = "NEEDS_INFORMATION";
    recommendationLabel = "ACTION REQUIRED — INSUFFICIENT INFORMATION";
    recommendationMessage = "Critical authorization or geographic information is missing. Returned to NGO for resolution.";
  }

  const completedAt = new Date();

  return {
    verificationId,
    runNumber,
    projectId: (project._id || project.projectId || "").toString(),
    projectName: project.projectName || project.name || "Untitled Project",
    ngoId: project.ngoId || "NGO Steward",
    walletAddress: project.walletAddress,
    engineVersion: ENGINE_VERSION,
    requestedAt,
    startedAt,
    completedAt,
    lastVerifiedAt: completedAt,
    status: aiState,
    overallRecommendation,
    recommendationLabel,
    recommendationMessage,

    // Detailed 5-Dimension Structured Evidence Report
    landAuthorization: {
      status: landAuthorizationStatus,
      documentsAnalyzed: landDocs.length,
      findings: landFindings,
      warnings: landWarnings,
      legalDisclaimer: "Land authorization status is evaluated for plausibility only. Official legal land ownership cannot be automatically certified without an integrated government land registry API. Certified Human Validator review is required."
    },
    documentAnalysis: documentReports,
    ngoConsistency: {
      status: ngoWarnings.length > 0 ? "POTENTIAL_INCONSISTENCY" : ngoFindings.length > 0 ? "SUPPORTED" : "INSUFFICIENT_EVIDENCE",
      findings: ngoFindings,
      warnings: ngoWarnings
    },
    locationConsistency: locationMatchResult,
    authenticityOverlap: authenticityResult,
    satelliteAnalysis: satelliteResult,
    vegetationPlausibility: {
      status: anomalyResult.status === "FAIL" ? "FAIL" : "SUPPORTED",
      anomalyReport: anomalyResult,
      biomassModel: biomassResult,
      carbonAccounting: carbonResult
    },
    evidenceCrypto: evidenceCryptoResult,

    actionRequired: actionRequiredList,
    riskFlags: allRiskFlags,
    limitations: allLimitations
  };
}

module.exports = {
  executePreVerificationPipeline,
  AI_STATES,
  ENGINE_VERSION
};
