import React, { useState, useEffect } from 'react';
import { ShieldCheck, Building2, Lock, KeyRound, Eye, EyeOff, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
import { loginValidator, loginCompany, getDemoValidators, getDemoCompanies } from '../services/authService';
import './RoleAuthModal.css';

const RoleAuthModal = ({ isOpen, roleToAuth, walletAddress, onClose, onSuccess }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [demoAccounts, setDemoAccounts] = useState([]);

  const isValidator = roleToAuth === 'validator';

  // Load demo accounts when modal opens
  useEffect(() => {
    if (!isOpen) {
      setLoginId('');
      setPassword('');
      setError(null);
      setSuccessData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchDemos = async () => {
      const demos = isValidator ? await getDemoValidators() : await getDemoCompanies();
      if (isMounted) setDemoAccounts(demos);
    };

    fetchDemos();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isValidator]);

  if (!isOpen) return null;

  const handleFillDemo = (demo) => {
    if (isValidator) {
      setLoginId(demo.validatorId);
      setPassword(demo.password || 'validator123');
    } else {
      setLoginId(demo.corporateId);
      setPassword(demo.password || 'corporate123');
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!loginId.trim()) {
      setError(`Please enter your ${isValidator ? 'Validator ID' : 'Corporate Login ID'}.`);
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = isValidator
        ? await loginValidator(loginId.trim(), password.trim(), walletAddress)
        : await loginCompany(loginId.trim(), password.trim(), walletAddress);

      if (!res.success) {
        setError(res.message);
        setLoading(false);
        return;
      }

      setSuccessData(res.validator || res.company);
      setTimeout(() => {
        onSuccess(res.validator || res.company);
      }, 700);
    } catch (err) {
      setError('Authentication failed. Please check network connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-auth-overlay" onClick={onClose}>
      <div className="role-auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="role-auth-close-btn" onClick={onClose} title="Cancel authentication">
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div className="role-auth-header">
          <div className={`role-auth-icon-badge ${isValidator ? 'validator-badge' : 'company-badge'}`}>
            {isValidator ? <ShieldCheck size={28} /> : <Building2 size={28} />}
          </div>
          <h2>{isValidator ? 'DAO Validator Authentication' : 'Corporate Company Authentication'}</h2>
          <p>
            {isValidator
              ? 'Enter accredited technical auditor credentials to access MRV verification & governance queues.'
              : 'Enter authorized corporate credentials to manage carbon offset requirements & marketplace settlements.'}
          </p>
        </div>

        {/* 1-Click Demo Quick Fill Chips */}
        {demoAccounts && demoAccounts.length > 0 && !successData && (
          <div className="role-auth-demo-section">
            <div className="role-auth-demo-title">
              <Sparkles size={14} /> Quick-Fill Demo Credentials (1-Click Prototype)
            </div>
            <div className="role-auth-demo-chips">
              {demoAccounts.map((item) => {
                const idVal = isValidator ? item.validatorId : item.corporateId;
                const labelVal = isValidator ? item.name : item.companyName;
                const isSelected = loginId.toUpperCase() === idVal.toUpperCase();
                return (
                  <button
                    key={idVal}
                    type="button"
                    className={`role-auth-demo-chip ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleFillDemo(item)}
                    title={`Auto-fill ${idVal}`}
                  >
                    <span className="chip-id">{idVal}</span>
                    <span className="chip-name">{labelVal}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successData && (
          <div className="role-auth-success-banner">
            <CheckCircle2 size={20} />
            <div>
              <strong>Authentication Verified!</strong>
              <span>
                Logged in as {isValidator ? successData.name : successData.companyName} ({isValidator ? successData.validatorId : successData.corporateId})
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="role-auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        {!successData && (
          <form onSubmit={handleSubmit} className="role-auth-form">
            <div className="form-group">
              <label htmlFor="role-login-id">
                <KeyRound size={15} /> {isValidator ? 'Validator Registration ID / Username' : 'Corporate ID / Username'}
              </label>
              <input
                id="role-login-id"
                type="text"
                value={loginId}
                onChange={(e) => {
                  setLoginId(e.target.value);
                  setError(null);
                }}
                placeholder={isValidator ? 'e.g. VAL-2024-001' : 'e.g. CORP-TATA-01'}
                autoFocus
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="role-login-password">
                <Lock size={15} /> Password
              </label>
              <div className="password-input-wrapper">
                <input
                  id="role-login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter role password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="role-auth-actions">
              <button type="button" className="btn-cancel" onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-authenticate" disabled={loading || !loginId.trim() || !password.trim()}>
                {loading ? (
                  <span className="auth-spinner-text">Authenticating...</span>
                ) : (
                  <span>Verify & Switch Role →</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RoleAuthModal;
