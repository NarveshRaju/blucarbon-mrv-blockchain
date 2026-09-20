import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  FileCheck2,
  Info,
  RotateCcw
} from 'lucide-react';
import { Button, Input, LoadingSpinner } from '../components/ui';
import { 
  verifyNGOIdentity, 
  fetchNGOVerificationStatus, 
  getDemoNGORegistry 
} from '../services/ngoService';
import './NGOVerify.css';

const NGOVerify = () => {
  const navigate = useNavigate();
  const { userAddress, connectWallet, loading: walletLoading } = useWeb3();
  const { role, ROLES } = useRole();

  const [darpanId, setDarpanId] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [errors, setErrors] = useState({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [generalError, setGeneralError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [demoRegistry, setDemoRegistry] = useState([]);

  // Check initial verification status and load demo registry
  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      setPageLoading(true);
      try {
        // Load demo registry for prototype ease of evaluation
        const demoList = await getDemoNGORegistry();
        if (isMounted) setDemoRegistry(demoList);

        if (userAddress) {
          const status = await fetchNGOVerificationStatus(userAddress);
          if (isMounted && status.verified && status.data) {
            setDarpanId(status.data.darpanId || '');
            setOrganizationName(status.data.organizationName || '');
          }
        }
      } catch (err) {
        console.warn('Initial status check notice:', err);
      } finally {
        if (isMounted) setPageLoading(false);
      }
    };

    init();

    return () => {
      isMounted = false;
    };
  }, [userAddress]);

  const handleFillDemo = (demoItem) => {
    setDarpanId(demoItem.darpanId);
    setOrganizationName(demoItem.organizationName);
    setErrors({});
    setGeneralError(null);
  };

  const validateForm = () => {
    const errs = {};
    if (!darpanId.trim()) {
      errs.darpanId = 'NGO DARPAN ID is required';
    }
    if (!organizationName.trim()) {
      errs.organizationName = 'Registered organization name is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setGeneralError(null);

    if (!userAddress) {
      setGeneralError('Please connect your MetaMask wallet before verifying.');
      return;
    }

    if (!validateForm()) return;

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyNGOIdentity(darpanId, organizationName, userAddress);
      if (result.success && result.verified) {
        setVerificationResult(result.data);
      } else {
        setGeneralError(result.message || 'NGO verification could not be completed.');
      }
    } catch (err) {
      setGeneralError(err.message || 'NGO verification could not be completed. Please check the DARPAN ID and registered organization name.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleContinueToOnboarding = () => {
    navigate('/ngo/onboarding', {
      state: {
        verifiedDarpanId: verificationResult?.darpanId || darpanId,
        verifiedOrgName: verificationResult?.organizationName || organizationName,
      },
    });
  };

  const handleResetVerification = () => {
    setVerificationResult(null);
    setGeneralError(null);
  };

  // 1. Loading State
  if (pageLoading) {
    return (
      <div className="ngo-verify-container">
        <LoadingSpinner text="Checking NGO verification status..." />
      </div>
    );
  }

  // 2. Disconnected Wallet State
  if (!userAddress) {
    return (
      <div className="ngo-verify-container">
        <div className="ngo-verify-access-card">
          <div className="verify-icon-circle">
            <ShieldCheck size={36} />
          </div>
          <h2>Connect Wallet to Verify NGO</h2>
          <p>
            Please connect your Web3 wallet to link and verify your organization identity on BlueCarbon MRV.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={connectWallet}
            loading={walletLoading}
            loadingText="Connecting..."
            icon={<ArrowRight size={18} />}
          >
            Connect MetaMask Wallet
          </Button>
        </div>
      </div>
    );
  }

  // 3. Role Notice if user is not in NGO role (admins can still access)
  const isWrongRole = role && role !== ROLES.NGO && role !== ROLES.ADMIN;

  return (
    <div className="ngo-verify-container">
      {/* Header */}
      <div className="ngo-verify-header">
        <div className="ngo-verify-header-text">
          <h1>Verify Your NGO</h1>
          <p>Verify your organization identity before completing NGO onboarding.</p>
        </div>
        <div className="ngo-verify-badge">
          <FileCheck2 size={16} />
          <span>Step 1 of 2: Identity Gate</span>
        </div>
      </div>

      {isWrongRole && (
        <div className="ngo-verify-alert warning">
          <AlertCircle size={20} />
          <div>
            <strong>Role Perspective Notice:</strong> You are currently operating under the <b>{role}</b> role. Switch to the <b>NGO Developer</b> role in the top header or sidebar to manage NGO projects.
          </div>
        </div>
      )}

      {/* Main Verification Card */}
      <div className="ngo-verify-card">
        {verificationResult ? (
          /* SUCCESS STATE */
          <div className="ngo-verify-success-view">
            <div className="verify-success-icon-wrap">
              <CheckCircle2 size={48} className="text-success" />
            </div>

            <h2 className="verify-success-title">NGO Identity Verified</h2>
            <p className="verify-success-desc">
              Your organization record has been successfully matched against the NGO registry and associated with your connected wallet.
            </p>

            <div className="verify-details-table">
              <div className="verify-detail-row">
                <span className="detail-label">Organization Name</span>
                <span className="detail-value font-bold">{verificationResult.organizationName}</span>
              </div>
              <div className="verify-detail-row">
                <span className="detail-label">DARPAN ID</span>
                <span className="detail-value font-mono">{verificationResult.darpanId}</span>
              </div>
              <div className="verify-detail-row">
                <span className="detail-label">Verification Status</span>
                <span className="detail-value status-badge-verified">
                  <ShieldCheck size={14} /> Verified
                </span>
              </div>
              <div className="verify-detail-row">
                <span className="detail-label">Connected Wallet</span>
                <span className="detail-value font-mono text-muted">
                  {userAddress.substring(0, 8)}...{userAddress.substring(userAddress.length - 6)}
                </span>
              </div>
            </div>

            <div className="verify-success-actions">
              <Button
                variant="primary"
                size="lg"
                onClick={handleContinueToOnboarding}
                icon={<ArrowRight size={18} />}
                className="btn-continue"
              >
                Continue to NGO Onboarding
              </Button>
              <button 
                type="button" 
                className="btn-secondary-link"
                onClick={handleResetVerification}
              >
                <RotateCcw size={14} /> Verify a different DARPAN record
              </button>
            </div>
          </div>
        ) : (
          /* INPUT FORM STATE */
          <form className="ngo-verify-form" onSubmit={handleVerify}>
            <div className="form-intro">
              <Building2 size={24} className="form-intro-icon" />
              <div>
                <h3>Organization Registry Lookup</h3>
                <p>Enter your official registration details to confirm organization authenticity.</p>
              </div>
            </div>

            {generalError && (
              <div className="ngo-verify-alert danger">
                <AlertCircle size={20} className="alert-icon" />
                <div className="alert-content">
                  <strong>Verification Notice</strong>
                  <p>{generalError}</p>
                </div>
              </div>
            )}

            <div className="form-fields">
              <Input
                label="NGO DARPAN ID"
                name="darpanId"
                placeholder="Enter your NGO DARPAN ID (e.g. DEMO-NGO-001)"
                value={darpanId}
                onChange={(e) => {
                  setDarpanId(e.target.value.toUpperCase());
                  if (errors.darpanId) setErrors((prev) => ({ ...prev, darpanId: '' }));
                }}
                error={errors.darpanId}
                required
                disabled={isVerifying}
                helperText="Standard NGO DARPAN Unique Identification Number"
              />

              <Input
                label="NGO / Organization Name"
                name="organizationName"
                placeholder="Enter registered NGO name"
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
                  if (errors.organizationName) setErrors((prev) => ({ ...prev, organizationName: '' }));
                }}
                error={errors.organizationName}
                required
                disabled={isVerifying}
                helperText="Official name registered with the registry"
              />
            </div>

            <div className="form-submit-row">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isVerifying}
                loadingText="Verifying NGO details..."
                icon={<Search size={18} />}
                className="btn-verify-submit"
              >
                Verify NGO
              </Button>
            </div>

            {/* Prototype Demo Dataset Helper */}
            <div className="demo-records-panel">
              <div className="demo-panel-header">
                <Info size={16} />
                <span>Prototype Demonstration Records</span>
              </div>
              <p className="demo-disclaimer">
                Prototype verification — demo registry lookup (government API integration not connected). Click any demo record below to auto-fill for testing:
              </p>
              <div className="demo-chips-grid">
                {demoRegistry.map((item) => (
                  <button
                    type="button"
                    key={item.darpanId}
                    className={`demo-chip ${darpanId === item.darpanId ? 'active' : ''}`}
                    onClick={() => handleFillDemo(item)}
                    disabled={isVerifying}
                  >
                    <span className="demo-chip-id">{item.darpanId}</span>
                    <span className="demo-chip-name">{item.organizationName}</span>
                    <span className="demo-chip-state">{item.state}</span>
                  </button>
                ))}
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Footer Navigation link */}
      <div className="ngo-verify-footer-nav">
        <Link to="/" className="back-link">
          ← Back to Main Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NGOVerify;
