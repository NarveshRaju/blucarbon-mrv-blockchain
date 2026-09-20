/**
 * AI Pre-Verification Service Proxy (Backend) — BlueChain MRV System
 */

const { executePreVerificationPipeline, AI_STATES, ENGINE_VERSION } = require("./aiPreVerificationService");
const { analyzeProjectEvidenceDocuments } = require("./documentAnalysisService");
const { matchLocationConsistency } = require("./locationMatchingService");
const { fetchSentinel2Data } = require("./copernicusService");

async function verifyProjectData(project, allProjects = [], runNumber = 1) {
  return await executePreVerificationPipeline(project, allProjects, runNumber);
}

module.exports = {
  verifyProjectData,
  executePreVerificationPipeline,
  AI_STATES,
  ENGINE_VERSION,
  analyzeProjectEvidenceDocuments,
  matchLocationConsistency,
  fetchSentinel2Data
};
