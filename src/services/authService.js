import { API_BASE_URL } from './api';

const AUTH_STORAGE_PREFIX = 'bcd_role_auth_';

// Fallback demo credentials for offline or fast prototypes
export const FALLBACK_DEMO_VALIDATORS = [
  {
    validatorId: 'VAL-2024-001',
    password: 'validator123',
    name: 'Dr. Ananya Sharma',
    organization: 'National Blue Carbon Verification Council',
    accreditation: 'QCI-NABCB Certified Lead GHG Auditor'
  },
  {
    validatorId: 'VAL-2024-002',
    password: 'validator123',
    name: 'Prof. Rajesh K. Nair',
    organization: 'Mangrove Coastal Ecology Institute',
    accreditation: 'UNFCCC Article 6 Registered Technical Auditor'
  },
  {
    validatorId: 'VAL-2024-003',
    password: 'validator123',
    name: 'Sunita Deshmukh',
    organization: 'Bureau of Carbon Verification India',
    accreditation: 'ISO 14064-3 Carbon Verification Assessor'
  }
];

export const FALLBACK_DEMO_COMPANIES = [
  {
    corporateId: 'CORP-TATA-01',
    password: 'corporate123',
    companyName: 'Tata Power Renewable Energy Ltd.',
    cin: 'L40100MH1919PLC000567',
    esgOfficer: 'Rajesh Verma (Head of ESG & Decarbonization)'
  },
  {
    corporateId: 'CORP-INFY-02',
    password: 'corporate123',
    companyName: 'Infosys ESG & Sustainability Wing',
    cin: 'L85110KA1981PLC013115',
    esgOfficer: 'Meera Krishnan (Chief Sustainability Officer)'
  },
  {
    corporateId: 'CORP-JSW-03',
    password: 'corporate123',
    companyName: 'JSW Energy Clean Transition Fund',
    cin: 'L74999MH1994PLC077041',
    esgOfficer: 'Amitabh Sen (Director of Climate Action)'
  }
];

/**
 * Fetch demo DAO Validator accounts from backend
 */
export async function getDemoValidators() {
  try {
    const res = await fetch(`${API_BASE_URL}/dao/demo-accounts`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const result = await res.json();
    return result.data && result.data.length > 0 ? result.data : FALLBACK_DEMO_VALIDATORS;
  } catch (err) {
    console.warn('Using fallback demo validators:', err.message);
    return FALLBACK_DEMO_VALIDATORS;
  }
}

/**
 * Fetch demo Corporate accounts from backend
 */
export async function getDemoCompanies() {
  try {
    const res = await fetch(`${API_BASE_URL}/company/demo-accounts`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const result = await res.json();
    return result.data && result.data.length > 0 ? result.data : FALLBACK_DEMO_COMPANIES;
  } catch (err) {
    console.warn('Using fallback demo companies:', err.message);
    return FALLBACK_DEMO_COMPANIES;
  }
}

/**
 * Authenticate DAO Validator credentials against backend
 */
export async function loginValidator(validatorId, password, walletAddress) {
  try {
    const res = await fetch(`${API_BASE_URL}/dao/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ validatorId, password, walletAddress })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Authentication failed. Please verify credentials.'
      };
    }

    if (walletAddress) {
      saveRoleAuth('validator', walletAddress, data.validator);
    }

    return {
      success: true,
      message: data.message,
      validator: data.validator
    };
  } catch (err) {
    console.error('Validator login error:', err);
    return {
      success: false,
      message: 'Network connection error while communicating with authentication server.'
    };
  }
}

/**
 * Authenticate Corporate Company credentials against backend
 */
export async function loginCompany(corporateId, password, walletAddress) {
  try {
    const res = await fetch(`${API_BASE_URL}/company/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ corporateId, password, walletAddress })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Authentication failed. Please verify corporate credentials.'
      };
    }

    if (walletAddress) {
      saveRoleAuth('company', walletAddress, data.company);
    }

    return {
      success: true,
      message: data.message,
      company: data.company
    };
  } catch (err) {
    console.error('Company login error:', err);
    return {
      success: false,
      message: 'Network connection error while communicating with authentication server.'
    };
  }
}

/**
 * Save authenticated role session locally
 */
export function saveRoleAuth(role, walletAddress, authData) {
  if (!role || !walletAddress) return;
  const key = `${AUTH_STORAGE_PREFIX}${role}_${walletAddress.toLowerCase().trim()}`;
  localStorage.setItem(key, JSON.stringify({
    ...authData,
    authenticatedAt: new Date().toISOString()
  }));
}

/**
 * Get authenticated role session
 */
export function getRoleAuth(role, walletAddress) {
  if (!role || !walletAddress) return null;
  try {
    const key = `${AUTH_STORAGE_PREFIX}${role}_${walletAddress.toLowerCase().trim()}`;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Clear authenticated role session
 */
export function clearRoleAuth(role, walletAddress) {
  if (!role || !walletAddress) return;
  const key = `${AUTH_STORAGE_PREFIX}${role}_${walletAddress.toLowerCase().trim()}`;
  localStorage.removeItem(key);
}
