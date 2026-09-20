/**
 * NGO Service — abstraction for NGO-related operations.
 *
 * Handles NGO Identity Verification via MongoDB backend API
 * and NGO profile onboarding data.
 */
import apiClient from './api';

const NGO_PROFILE_KEY_PREFIX = 'bluechain_ngo_profile';
const NGO_ONBOARDING_KEY_PREFIX = 'bluechain_ngo_onboarding';
const NGO_VERIFIED_KEY_PREFIX = 'bluechain_ngo_verified';

/**
 * Helper to get normalized storage key for a wallet address.
 * @param {string} prefix
 * @param {string} walletAddress
 * @returns {string}
 */
const getStorageKey = (prefix, walletAddress) => {
  if (!walletAddress) return null;
  return `${prefix}_${walletAddress.toLowerCase().trim()}`;
};

// ============================================================
// NGO Identity Verification APIs
// ============================================================

/**
 * Fetch demo NGO registry records for prototype showcase.
 * @returns {Promise<Array>}
 */
export const getDemoNGORegistry = async () => {
  try {
    const res = await apiClient.get('/ngo/demo-registry');
    return res.data?.data || [];
  } catch (err) {
    console.warn('Failed to fetch demo NGO registry from backend, using fallback demo list:', err.message);
    return [
      { darpanId: 'DEMO-NGO-001', organizationName: 'Coastal Green Foundation', state: 'West Bengal' },
      { darpanId: 'DEMO-NGO-002', organizationName: 'Mangrove Action Network India', state: 'Maharashtra' },
      { darpanId: 'DEMO-NGO-003', organizationName: 'Sundarbans Bio Restoration Trust', state: 'West Bengal' },
      { darpanId: 'DEMO-NGO-004', organizationName: 'Blue Carbon Marine Ecology Foundation', state: 'Odisha' },
      { darpanId: 'DEMO-NGO-005', organizationName: 'Wetlands Conservation Society', state: 'Kerala' },
    ];
  }
};

/**
 * Verify NGO DARPAN ID and Name against MongoDB Backend Registry.
 *
 * @param {string} darpanId
 * @param {string} organizationName
 * @param {string} walletAddress
 * @returns {Promise<{success: boolean, verified: boolean, message: string, data?: object}>}
 */
export const verifyNGOIdentity = async (darpanId, organizationName, walletAddress) => {
  if (!darpanId || !darpanId.trim()) {
    throw new Error('NGO DARPAN ID is required');
  }
  if (!organizationName || !organizationName.trim()) {
    throw new Error('Registered organization name is required');
  }
  if (!walletAddress) {
    throw new Error('Connected wallet address is required for verification');
  }

  try {
    const response = await apiClient.post('/ngo/verify', {
      darpanId: darpanId.trim(),
      organizationName: organizationName.trim(),
      walletAddress: walletAddress.toLowerCase().trim(),
    });

    const result = response.data;
    if (result.success && result.verified && result.data) {
      // Cache verified record locally for this wallet
      saveLocalNGOVerification(walletAddress, result.data);
    }
    return result;
  } catch (err) {
    const errorMsg = err.response?.data?.message || err.message || 'NGO verification failed. Please try again.';
    throw new Error(errorMsg);
  }
};

/**
 * Check NGO Identity Verification Status for a connected wallet from backend.
 *
 * @param {string} walletAddress
 * @returns {Promise<{verified: boolean, data?: object}>}
 */
export const fetchNGOVerificationStatus = async (walletAddress) => {
  if (!walletAddress) return { verified: false, data: null };

  try {
    const response = await apiClient.get(`/ngo/verify-status/${walletAddress.toLowerCase().trim()}`);
    const { verified, data } = response.data;
    if (verified && data) {
      saveLocalNGOVerification(walletAddress, data);
      return { verified: true, data };
    } else {
      // Check local cache if backend is temporarily unreachable or empty
      const local = getLocalNGOVerification(walletAddress);
      return { verified: Boolean(local), data: local };
    }
  } catch (err) {
    console.warn('Backend verification status check failed, checking local cache:', err.message);
    const local = getLocalNGOVerification(walletAddress);
    return { verified: Boolean(local), data: local };
  }
};

/**
 * Get locally cached NGO verification record.
 * @param {string} walletAddress
 * @returns {object|null}
 */
export const getLocalNGOVerification = (walletAddress) => {
  if (!walletAddress) return null;
  const key = getStorageKey(NGO_VERIFIED_KEY_PREFIX, walletAddress);
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    return null;
  }
};

/**
 * Save locally cached NGO verification record.
 * @param {string} walletAddress
 * @param {object} verificationData
 */
export const saveLocalNGOVerification = (walletAddress, verificationData) => {
  if (!walletAddress) return;
  const key = getStorageKey(NGO_VERIFIED_KEY_PREFIX, walletAddress);
  try {
    localStorage.setItem(key, JSON.stringify({
      ...verificationData,
      walletAddress: walletAddress.toLowerCase().trim(),
      verifiedAt: verificationData.verifiedAt || new Date().toISOString(),
    }));
  } catch (err) {
    console.warn('Failed to cache NGO verification record locally:', err);
  }
};

/**
 * Check synchronously if an NGO is verified locally.
 * @param {string} walletAddress
 * @returns {boolean}
 */
export const isNGOVerified = (walletAddress) => {
  if (!walletAddress) return false;
  const data = getLocalNGOVerification(walletAddress);
  return Boolean(data && data.darpanId);
};

// ============================================================
// NGO Profile & Onboarding Operations
// ============================================================

/**
 * Get the NGO profile for a given wallet address.
 *
 * @param {string} walletAddress
 * @returns {object|null} NGO profile data or null if not found
 */
export const getNGOProfile = (walletAddress) => {
  if (!walletAddress) return null;
  const key = getStorageKey(NGO_PROFILE_KEY_PREFIX, walletAddress);
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch (err) {
    console.error('Failed to retrieve NGO profile from storage:', err);
    return null;
  }
};

/**
 * Check if an NGO has completed onboarding for a given wallet address.
 *
 * @param {string} walletAddress
 * @returns {boolean}
 */
export const isNGOOnboarded = (walletAddress) => {
  if (!walletAddress) return false;
  const profile = getNGOProfile(walletAddress);
  return Boolean(profile && profile.onboardingCompleted);
};

/**
 * Alias for isNGOOnboarded / profile existence check.
 *
 * @param {string} walletAddress
 * @returns {boolean}
 */
export const hasNGOProfile = (walletAddress) => {
  return isNGOOnboarded(walletAddress);
};

/**
 * Save or update the NGO profile for a given wallet address.
 *
 * @param {string} walletAddress
 * @param {object} profileData
 * @returns {object} The saved profile data (with timestamps)
 */
export const saveNGOProfile = (walletAddress, profileData) => {
  if (!walletAddress) throw new Error('Wallet address is required to save NGO profile');

  const key = getStorageKey(NGO_PROFILE_KEY_PREFIX, walletAddress);
  const existingProfile = getNGOProfile(walletAddress);

  const profile = {
    ...profileData,
    walletAddress: walletAddress.toLowerCase().trim(),
    onboardingCompleted: profileData.onboardingCompleted !== undefined ? profileData.onboardingCompleted : true,
    updatedAt: new Date().toISOString(),
    createdAt: existingProfile?.createdAt || new Date().toISOString(),
  };

  try {
    localStorage.setItem(key, JSON.stringify(profile));
    // Also store completion status flag
    const statusKey = getStorageKey(NGO_ONBOARDING_KEY_PREFIX, walletAddress);
    localStorage.setItem(statusKey, 'true');
  } catch (err) {
    console.error('Failed to save NGO profile to storage:', err);
    throw new Error('Could not save NGO profile to local storage. Please check browser storage permissions.');
  }

  return profile;
};

/**
 * Remove the NGO profile for a given wallet address.
 * Used during testing or when an NGO wants to reset their profile.
 *
 * @param {string} walletAddress
 */
export const clearNGOProfile = (walletAddress) => {
  if (!walletAddress) return;
  const key = getStorageKey(NGO_PROFILE_KEY_PREFIX, walletAddress);
  const statusKey = getStorageKey(NGO_ONBOARDING_KEY_PREFIX, walletAddress);
  const verifyKey = getStorageKey(NGO_VERIFIED_KEY_PREFIX, walletAddress);
  try {
    localStorage.removeItem(key);
    localStorage.removeItem(statusKey);
    localStorage.removeItem(verifyKey);
  } catch (err) {
    console.error('Failed to clear NGO profile from storage:', err);
  }
};
