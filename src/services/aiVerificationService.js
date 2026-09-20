/**
 * AI Pre-Verification Service (Frontend Client) — BlueChain MRV System
 *
 * Communicates with the backend AI Pre-Verification Engine endpoints.
 * Strictly adheres to NO-MOCK policy.
 */

import apiClient from './api';

/**
 * Starts the master AI Pre-Verification pipeline on the backend for a given project.
 * @param {string} projectId - MongoDB Form ID
 * @param {string} [walletAddress] - Connected wallet address
 * @returns {Promise<object>} Latest AI Pre-Verification Report
 */
export const runAIVerification = async (projectId, walletAddress = '') => {
  if (!projectId) throw new Error('Project ID is required to start AI verification.');
  const response = await apiClient.post(`/forms/${projectId}/ai-verification/start`, { walletAddress });
  return response.data?.aiVerification || response.data;
};

/**
 * Retrieves the complete audit history of all verification runs for a project.
 * @param {string} projectId - MongoDB Form ID
 * @returns {Promise<Array<object>>} List of historical verification runs
 */
export const getAIVerificationHistory = async (projectId) => {
  if (!projectId) return [];
  try {
    const response = await apiClient.get(`/forms/${projectId}/ai-verification/history`);
    return response.data?.runs || [];
  } catch (err) {
    console.error('Failed to fetch verification history:', err);
    return [];
  }
};

/**
 * Re-runs AI verification after project corrections (creates a new run record).
 * @param {string} projectId - MongoDB Form ID
 * @param {string} [walletAddress] - Connected wallet address
 * @returns {Promise<object>} New AI Pre-Verification Report
 */
export const rerunAIVerification = async (projectId, walletAddress = '') => {
  if (!projectId) throw new Error('Project ID is required to re-run AI verification.');
  const response = await apiClient.post(`/forms/${projectId}/ai-verification/rerun`, { walletAddress });
  return response.data?.aiVerification || response.data;
};

/**
 * Helper to get latest AI verification result from a project object.
 * @param {object|string} projectOrId
 * @returns {object|null} AI verification report or null if not executed
 */
export const getAIVerificationResult = (projectOrId) => {
  if (!projectOrId) return null;
  if (typeof projectOrId === 'object') {
    const ai = projectOrId.aiVerification;
    if (ai && ai.status && ai.status !== 'ai_pending' && ai.status !== 'ai_processing') {
      return ai;
    }
  }
  return null;
};
