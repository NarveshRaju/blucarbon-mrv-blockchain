import React, { createContext, useState, useContext, useCallback } from 'react';
import { Sprout, Search, Gem, ShieldCheck } from 'lucide-react';

const RoleContext = createContext();

const ROLES = {
  NGO: 'ngo',
  VALIDATOR: 'validator',
  INVESTOR: 'investor',
  ADMIN: 'admin',
};

const ROLE_LABELS = {
  [ROLES.NGO]: 'NGO Developer',
  [ROLES.VALIDATOR]: 'Validator',
  [ROLES.INVESTOR]: 'Investor',
  [ROLES.ADMIN]: 'Admin',
};

const ROLE_DESCRIPTIONS = {
  [ROLES.NGO]: 'Submit blue carbon projects, upload MRV data, and receive BCT tokens for verified carbon sequestration.',
  [ROLES.VALIDATOR]: 'Review and verify project submissions, vote on proposals, and stake tokens to back verifications.',
  [ROLES.INVESTOR]: 'Trade BCT tokens, vote on governance proposals, and retire carbon credits for offsets.',
  [ROLES.ADMIN]: 'Execute governance decisions, manage DAO parameters, and oversee platform operations.',
};


const ROLE_ICONS = {
  [ROLES.NGO]: <Sprout size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
  [ROLES.VALIDATOR]: <Search size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
  [ROLES.INVESTOR]: <Gem size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
  [ROLES.ADMIN]: <ShieldCheck size={16} style={{ verticalAlign: 'middle', marginRight: '4px' }} />,
};

export const RoleProvider = ({ children }) => {
  const [role, setRoleState] = useState(null);
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  // Load saved role for the connected wallet
  const loadRoleForAddress = useCallback((walletAddress) => {
    if (!walletAddress) {
      setRoleState(null);
      return;
    }
    const savedRole = localStorage.getItem(`bcd_role_${walletAddress.toLowerCase()}`);
    if (savedRole && Object.values(ROLES).includes(savedRole)) {
      setRoleState(savedRole);
      setShowRoleSelector(false);
    } else {
      setRoleState(null);
      setShowRoleSelector(true);
    }
  }, []);

  // Save role for wallet address
  const setRole = useCallback((newRole, walletAddress) => {
    if (!walletAddress) return;
    setRoleState(newRole);
    localStorage.setItem(`bcd_role_${walletAddress.toLowerCase()}`, newRole);
    setShowRoleSelector(false);
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((checkRole) => {
    return role === checkRole;
  }, [role]);

  // Clear role on disconnect
  const clearRole = useCallback(() => {
    setRoleState(null);
    setShowRoleSelector(false);
  }, []);

  return (
    <RoleContext.Provider
      value={{
        role,
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
