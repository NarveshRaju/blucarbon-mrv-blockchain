import React, { createContext, useState, useContext, useCallback } from 'react';
import { Sprout, Search, Building2, ShieldCheck } from 'lucide-react';
import { getRoleAuth, saveRoleAuth } from './services/authService';

const RoleContext = createContext();

const ROLES = {
  NGO: 'ngo',
  VALIDATOR: 'validator',
  COMPANY: 'company',
  INVESTOR: 'company', // backwards compatibility alias
  ADMIN: 'admin',
};

const ROLE_LABELS = {
  [ROLES.NGO]: 'NGO Developer',
  [ROLES.VALIDATOR]: 'Validator',
  [ROLES.COMPANY]: 'Company',
  [ROLES.ADMIN]: 'Admin',
};

const ROLE_DESCRIPTIONS = {
  [ROLES.NGO]: 'Submit blue carbon projects, upload MRV data, and receive BCT tokens for verified carbon sequestration.',
  [ROLES.VALIDATOR]: 'Review project checks and evidence, request changes, or approve and issue demo tokens.',
  [ROLES.COMPANY]: 'Explore projects, view issued demo tokens, and try the marketplace simulation.',
  [ROLES.ADMIN]: 'Execute governance decisions, manage DAO parameters, and oversee platform operations.',
};

const ROLE_ICONS = {
  [ROLES.NGO]: <Sprout size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
  [ROLES.VALIDATOR]: <Search size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
  [ROLES.COMPANY]: <Building2 size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
  [ROLES.ADMIN]: <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
};

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(null);
  const [roleAuthData, setRoleAuthData] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Load saved role for the connected wallet
  const loadRoleForAddress = useCallback((walletAddress) => {
    if (!walletAddress) {
      setRoleState(null);
      setRoleAuthData(null);
      return;
    }
    let savedRole = localStorage.getItem(`bcd_role_${walletAddress.toLowerCase()}`);
    if (savedRole === 'investor') savedRole = 'company';
    if (savedRole && (Object.values(ROLES).includes(savedRole) || savedRole === 'company')) {
      setRoleState(savedRole);
      const auth = getRoleAuth(savedRole, walletAddress);
      setRoleAuthData(auth);
      setShowRoleSelector(false);
    } else {
      setRoleState(null);
      setRoleAuthData(null);
      setShowRoleSelector(true);
    }
  }, []);

  // Save role for wallet address
  const setRole = useCallback((newRole, walletAddress, authData = null) => {
    if (!walletAddress) return;
    const normalizedRole = newRole === 'investor' ? 'company' : newRole;
    setRoleState(normalizedRole);
    localStorage.setItem(`bcd_role_${walletAddress.toLowerCase()}`, normalizedRole);
    
    if (authData) {
      saveRoleAuth(normalizedRole, walletAddress, authData);
      setRoleAuthData(authData);
    } else {
      const existingAuth = getRoleAuth(normalizedRole, walletAddress);
      setRoleAuthData(existingAuth);
    }

    setShowRoleSelector(false);
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((checkRole) => {
    if (checkRole === 'company' || checkRole === 'investor') {
      return role === 'company' || role === 'investor';
    }
    return role === checkRole;
  }, [role]);

  // Clear role on disconnect
  const clearRole = useCallback(() => {
    setRoleState(null);
    setRoleAuthData(null);
    setShowRoleSelector(false);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
        roleAuthData,
        activeValidator: role === ROLES.VALIDATOR ? roleAuthData : null,
        activeCompany: role === ROLES.COMPANY ? roleAuthData : null,
        setRole,
        hasRole,
        clearRole,
        loadRoleForAddress,
        showRoleSelector,
        setShowRoleSelector,
        ROLES,
        ROLE_LABELS,
        ROLE_DESCRIPTIONS,
        ROLE_ICONS,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => useContext(RoleContext);
export { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_ICONS };
