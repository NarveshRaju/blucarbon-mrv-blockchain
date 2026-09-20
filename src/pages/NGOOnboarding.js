import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import { 
  Building2, 
  FileText, 
  CheckCircle2, 
  MapPin, 
  Mail, 
  Phone, 
  Globe, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  Edit3, 
  Sprout,
  Sparkles
} from 'lucide-react';
import StepWizard from '../components/StepWizard';
import {
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner
} from '../components/ui';
import { 
  getNGOProfile, 
  saveNGOProfile,
  fetchNGOVerificationStatus,
  getLocalNGOVerification
} from '../services/ngoService';
import './NGOOnboarding.css';

const ORGANIZATION_TYPES = [
  { value: 'Environmental NGO', label: 'Environmental NGO' },
  { value: 'Non-Profit Organization', label: 'Non-Profit Organization' },
  { value: 'Community Organization', label: 'Community Organization' },
  { value: 'Research Organization', label: 'Research Organization' },
  { value: 'Other', label: 'Other' },
];

const INITIAL_FORM_STATE = {
  organizationName: '',
  registrationNumber: '',
  organizationType: 'Environmental NGO',
  yearEstablished: '',
  website: '',
  officialEmail: '',
  contactNumber: '',
  description: '',
  mission: '',
  areasOfWork: 'Mangrove Restoration, Coastal Conservation',
  state: '',
  district: '',
  previousProjects: '',
};

const NGOOnboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userAddress, connectWallet, loading: walletLoading } = useWeb3();
  const { role, ROLES } = useRole();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingProfile, setExistingProfile] = useState(null);
  const [isVerified, setIsVerified] = useState(false);
  const [verifiedNgoData, setVerifiedNgoData] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  // Check verification status & existing profile for connected wallet
  useEffect(() => {
    let isMounted = true;

    const checkVerificationAndProfile = async () => {
      setPageLoading(true);
      if (userAddress) {
        // 1. Check Identity Verification
        let vData = location.state?.verifiedDarpanId
          ? {
              darpanId: location.state.verifiedDarpanId,
              organizationName: location.state.verifiedOrgName || '',
            }
          : getLocalNGOVerification(userAddress);

        if (!vData) {
          const statusRes = await fetchNGOVerificationStatus(userAddress);
          if (statusRes.verified && statusRes.data) {
            vData = statusRes.data;
          }
        }

        if (isMounted) {
          setIsVerified(Boolean(vData));
          setVerifiedNgoData(vData);
        }

        // 2. Check Existing Profile
        const profile = getNGOProfile(userAddress);
        if (profile && profile.onboardingCompleted) {
          if (isMounted) {
            setExistingProfile(profile);
            setFormData({
              organizationName: profile.organizationName || vData?.organizationName || '',
              registrationNumber: profile.registrationNumber || vData?.darpanId || '',
              organizationType: profile.organizationType || 'Environmental NGO',
              yearEstablished: profile.yearEstablished || '',
              website: profile.website || '',
              officialEmail: profile.officialEmail || '',
              contactNumber: profile.contactNumber || '',
              description: profile.description || '',
              mission: profile.mission || '',
              areasOfWork: profile.areasOfWork || '',
              state: profile.state || vData?.state || '',
              district: profile.district || '',
              previousProjects: profile.previousProjects || '',
            });
          }
        } else {
          if (isMounted) {
            setExistingProfile(null);
            // Pre-fill form with verified DARPAN details for smooth onboarding
            if (vData) {
              setFormData((prev) => ({
                ...prev,
                organizationName: vData.organizationName || prev.organizationName,
                registrationNumber: vData.darpanId || prev.registrationNumber,
                state: vData.state || prev.state,
              }));
            }
          }
        }
      } else {
        if (isMounted) {
          setExistingProfile(null);
          setIsVerified(false);
          setVerifiedNgoData(null);
        }
      }
      if (isMounted) setPageLoading(false);
    };

    checkVerificationAndProfile();

    return () => {
      isMounted = false;
    };
  }, [userAddress, location.state]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on input change
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Validation per step
  const validateStep = (stepIndex) => {
    const errors = {};
    const currentYear = new Date().getFullYear();

    if (stepIndex === 0) {
      if (!formData.organizationName.trim()) {
        errors.organizationName = 'Organization name is required';
      }
      if (!formData.registrationNumber.trim()) {
        errors.registrationNumber = 'Registration number is required';
      }
      if (!formData.organizationType) {
        errors.organizationType = 'Please select an organization type';
      }
      if (!formData.yearEstablished) {
        errors.yearEstablished = 'Year established is required';
      } else {
        const year = parseInt(formData.yearEstablished, 10);
        if (isNaN(year) || year < 1850 || year > currentYear) {
          errors.yearEstablished = `Please enter a valid year (1850 - ${currentYear})`;
        }
      }
      if (!formData.officialEmail.trim()) {
        errors.officialEmail = 'Official email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.officialEmail.trim())) {
        errors.officialEmail = 'Please enter a valid email address';
      }
      if (!formData.contactNumber.trim()) {
        errors.contactNumber = 'Contact phone number is required';
      } else if (!/^[0-9+()-\s]{7,20}$/.test(formData.contactNumber.trim())) {
        errors.contactNumber = 'Please enter a valid contact number';
      }
    }

    if (stepIndex === 1) {
      if (!formData.description.trim()) {
        errors.description = 'Organization description is required';
      } else if (formData.description.trim().length < 20) {
        errors.description = 'Please provide a more descriptive summary (at least 20 characters)';
      }
      if (!formData.mission.trim()) {
        errors.mission = 'Mission / objective is required';
      }
      if (!formData.areasOfWork.trim()) {
        errors.areasOfWork = 'Primary areas of work are required';
      }
      if (!formData.state.trim()) {
        errors.state = 'State / Region is required';
      }
      if (!formData.district.trim()) {
        errors.district = 'District / City is required';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => Math.min(prev + 1, 2));
    }
  };

  const handlePrev = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleConfirmSubmit = async () => {
    if (!userAddress) return;
    setIsSubmitting(true);

    try {
      // Save profile locally via ngoService
      const saved = saveNGOProfile(userAddress, {
        ...formData,
        yearEstablished: parseInt(formData.yearEstablished, 10) || formData.yearEstablished,
        onboardingCompleted: true,
      });

      setExistingProfile(saved);
      setIsSubmitting(false);
      setIsSuccess(true);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
      setIsSubmitting(false);
      setFormErrors({ submit: 'Failed to save profile. Please try again.' });
    }
  };

  // Step definitions for the StepWizard
  const wizardSteps = [
    { key: 'details', label: 'Organization Details', icon: <Building2 size={16} /> },
    { key: 'profile', label: 'Profile & Mission', icon: <FileText size={16} /> },
    { key: 'review', label: 'Review & Confirm', icon: <CheckCircle2 size={16} /> },
  ];

  // 1. Loading State
  if (pageLoading) {
    return (
      <div className="onboarding-page-container">
        <LoadingSpinner text="Checking NGO profile status..." />
      </div>
    );
  }

  // 2. Disconnected Wallet State
  if (!userAddress) {
    return (
      <div className="onboarding-page-container">
        <div className="onboarding-access-card">
          <div className="access-icon-circle">
            <ShieldCheck size={36} className="text-primary" />
          </div>
          <h2>Connect Wallet to Begin Onboarding</h2>
          <p>
            Please connect your MetaMask wallet to establish your organization's decentralized identity on BlueChain.
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

  // 3. Role Access Check (NGO or Admin only)
  if (role && role !== ROLES.NGO && role !== ROLES.ADMIN) {
    return (
      <div className="onboarding-page-container">
        <div className="onboarding-access-card">
          <div className="access-icon-circle warning">
            <AlertCircle size={36} />
          </div>
          <h2>NGO Access Required</h2>
          <p>
            This onboarding flow is dedicated to <strong>NGO Project Developers</strong>. You are currently connected with the role of <strong>{role}</strong>.
          </p>
          <div className="access-actions">
            <Link to="/profile" className="bc-btn bc-btn--secondary">
              Switch Role in Profile
            </Link>
            <Link to="/" className="bc-btn bc-btn--ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3b. Identity Verification Gate Check (Must verify DARPAN ID first)
  if (!isVerified && !existingProfile?.onboardingCompleted) {
    return (
      <div className="onboarding-page-container">
        <div className="onboarding-access-card">
          <div className="access-icon-circle warning">
            <ShieldCheck size={36} />
          </div>
          <h2>NGO Identity Verification Required</h2>
          <p>
            Before completing organization profile onboarding and submitting blue carbon projects, your NGO identity (DARPAN ID) must be verified against the registry.
          </p>
          <div className="access-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/ngo/verify')}
              icon={<ArrowRight size={18} />}
            >
              Verify NGO Identity
            </Button>
            <Link to="/" className="bc-btn bc-btn--ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Success State after submission
  if (isSuccess) {
    return (
      <div className="onboarding-page-container">
        <div className="onboarding-success-card">
          <div className="success-icon-badge">
            <Sparkles size={40} />
          </div>
          <h2>NGO Profile Setup Complete!</h2>
          <p className="success-subtitle">
            <strong>{formData.organizationName}</strong> is now registered under your wallet identity on BlueChain.
          </p>

          <div className="success-identity-box">
            <span className="identity-label">Linked Wallet Identity</span>
            <code className="identity-value">{userAddress}</code>
            <div className="identity-status">
              <span className="status-indicator active" />
              <span>Profile Submitted • Ready for Project Registration</span>
            </div>
          </div>

          <div className="success-actions">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/ngo/submit')}
              icon={<Sprout size={18} />}
            >
              Continue to Project Registration
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/')}
            >
              Go to NGO Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 5. Returning User: Profile Already Complete (and not in edit mode)
  if (existingProfile && !isEditing) {
    return (
      <div className="onboarding-page-container">
        <header className="onboarding-header">
          <div>
            <h1>NGO Profile</h1>
            <p>Your verified organization profile and registration details</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => setIsEditing(true)}
            icon={<Edit3 size={16} />}
          >
            Edit Profile
          </Button>
        </header>

        {/* Profile Overview Card */}
        <div className="profile-complete-card">
          <div className="profile-banner">
            <div className="profile-avatar">
              <Building2 size={36} />
            </div>
            <div className="profile-title-group">
              <h2>{existingProfile.organizationName}</h2>
              <div className="profile-tags">
                <span className="profile-type-tag">{existingProfile.organizationType}</span>
                <span className="profile-status-tag">
                  <CheckCircle2 size={14} /> Profile Completed
                </span>
              </div>
            </div>
          </div>

          <div className="profile-grid">
            <div className="profile-section">
              <h3>Organization Details</h3>
              <div className="profile-field-list">
                <div>
                  <span className="field-label">Registration Number</span>
                  <span className="field-value">{existingProfile.registrationNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Year Established</span>
                  <span className="field-value">{existingProfile.yearEstablished || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label">Linked Wallet</span>
                  <span className="field-value mono">{existingProfile.walletAddress}</span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Contact Information</h3>
              <div className="profile-field-list">
                <div>
                  <span className="field-label"><Mail size={14} /> Official Email</span>
                  <span className="field-value">{existingProfile.officialEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label"><Phone size={14} /> Contact Number</span>
                  <span className="field-value">{existingProfile.contactNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label"><Globe size={14} /> Website</span>
                  <span className="field-value">
                    {existingProfile.website ? (
                      <a href={existingProfile.website.startsWith('http') ? existingProfile.website : `https://${existingProfile.website}`} target="_blank" rel="noopener noreferrer">
                        {existingProfile.website}
                      </a>
                    ) : 'Not specified'}
                  </span>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h3>Location</h3>
              <div className="profile-field-list">
                <div>
                  <span className="field-label"><MapPin size={14} /> State / Region</span>
                  <span className="field-value">{existingProfile.state || 'N/A'}</span>
                </div>
                <div>
                  <span className="field-label"><MapPin size={14} /> District / City</span>
                  <span className="field-value">{existingProfile.district || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="profile-section full-width">
              <h3>Mission & Objectives</h3>
              <p className="profile-text-block">{existingProfile.mission || 'No mission statement provided.'}</p>
            </div>

            <div className="profile-section full-width">
              <h3>Organization Overview</h3>
              <p className="profile-text-block">{existingProfile.description || 'No description provided.'}</p>
            </div>

            {existingProfile.areasOfWork && (
              <div className="profile-section full-width">
                <h3>Primary Areas of Work</h3>
                <p className="profile-text-block">{existingProfile.areasOfWork}</p>
              </div>
            )}

            {existingProfile.previousProjects && (
              <div className="profile-section full-width">
                <h3>Previous Restoration Projects</h3>
                <p className="profile-text-block">{existingProfile.previousProjects}</p>
              </div>
            )}
          </div>

          <div className="profile-actions-bar">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate('/ngo/submit')}
              icon={<Sprout size={18} />}
            >
              Register New Project
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/ngo/projects')}
            >
              View My Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 6. Active Multi-step Onboarding Wizard Form
  return (
    <div className="onboarding-page-container">
      <header className="onboarding-header">
        <div>
          <h1>NGO Organization Onboarding</h1>
          <p>
            {isEditing
              ? 'Update your organization profile and contact information'
              : 'Complete your organization details before submitting blue carbon projects'}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {verifiedNgoData && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#e6f4ea', color: '#137333', padding: '6px 12px', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '600', border: '1px solid rgba(19, 115, 51, 0.2)' }}>
              <ShieldCheck size={14} />
              <span>DARPAN: {verifiedNgoData.darpanId}</span>
            </div>
          )}
          {isEditing && (
            <Button variant="ghost" onClick={() => setIsEditing(false)}>
              Cancel Editing
            </Button>
          )}
        </div>
      </header>

      {formErrors.submit && (
        <div className="onboarding-error-banner">
          <AlertCircle size={18} />
          <span>{formErrors.submit}</span>
        </div>
      )}

      <div className="onboarding-wizard-container">
        <StepWizard
          steps={wizardSteps}
          activeStep={activeStep}
          onNext={handleNext}
          onPrev={handlePrev}
          onSubmit={handleConfirmSubmit}
          isSubmitting={isSubmitting}
          submitLabel={isEditing ? 'Save Updated Profile' : 'Confirm & Complete Onboarding'}
          nextLabel="Continue to Next Step"
          prevLabel="Back"
        >
          {/* STEP 1: Organization Details */}
          {activeStep === 0 && (
            <div className="step-panel">
              <div className="step-panel-intro">
                <h3>Organization Information</h3>
                <p>Provide verified identification and contact details for your NGO or restoration entity.</p>
              </div>

              <div className="form-grid-2col">
                <Input
                  label="NGO / Organization Name"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  placeholder="e.g. Mangrove Foundation of India"
                  required
                  error={formErrors.organizationName}
                  hint="Official registered name of the non-profit or entity"
                />

                <Input
                  label="NGO Registration Number"
                  name="registrationNumber"
                  value={formData.registrationNumber}
                  onChange={handleInputChange}
                  placeholder="e.g. NGO-REG-2018-9481"
                  required
                  error={formErrors.registrationNumber}
                  hint="Government registration or non-profit identification number"
                />

                <Select
                  label="Organization Type"
                  name="organizationType"
                  value={formData.organizationType}
                  onChange={handleInputChange}
                  options={ORGANIZATION_TYPES}
                  required
                  error={formErrors.organizationType}
                />

                <Input
                  label="Year Established"
                  name="yearEstablished"
                  type="number"
                  value={formData.yearEstablished}
                  onChange={handleInputChange}
                  placeholder="e.g. 2016"
                  required
                  error={formErrors.yearEstablished}
                  hint="Year organization was founded"
                />

                <Input
                  label="Official Email Address"
                  name="officialEmail"
                  type="email"
                  value={formData.officialEmail}
                  onChange={handleInputChange}
                  placeholder="contact@mangrovefoundation.org"
                  required
                  error={formErrors.officialEmail}
                  hint="For verification notices and DAO updates"
                />

                <Input
                  label="Contact Phone Number"
                  name="contactNumber"
                  type="tel"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  placeholder="+91 98765 43210"
                  required
                  error={formErrors.contactNumber}
                />

                <div className="full-col">
                  <Input
                    label="Official Website (Optional)"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://www.mangrovefoundation.org"
                    hint="Link to organization website or portfolio"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Profile & Mission */}
          {activeStep === 1 && (
            <div className="step-panel">
              <div className="step-panel-intro">
                <h3>Ecological Mission & Location</h3>
                <p>Describe your restoration scope, geographical operational zone, and experience.</p>
              </div>

              <div className="form-grid-2col">
                <div className="full-col">
                  <Textarea
                    label="Organization Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Briefly describe the environmental, restoration, or community work carried out by your organization..."
                    required
                    error={formErrors.description}
                    hint="Overview of your organization's background and team capabilities"
                  />
                </div>

                <div className="full-col">
                  <Textarea
                    label="Mission & Objectives"
                    name="mission"
                    value={formData.mission}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="State the core mission, long-term conservation vision, and blue carbon objectives..."
                    required
                    error={formErrors.mission}
                    hint="Your primary goals for blue carbon ecosystem restoration"
                  />
                </div>

                <div className="full-col">
                  <Input
                    label="Primary Areas of Work"
                    name="areasOfWork"
                    value={formData.areasOfWork}
                    onChange={handleInputChange}
                    placeholder="e.g. Mangrove Plantation, Tidal Marsh Rehabilitation, Coastal Community Training"
                    required
                    error={formErrors.areasOfWork}
                    hint="Comma-separated ecological domains"
                  />
                </div>

                <Input
                  label="State / Region"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  placeholder="e.g. Maharashtra"
                  required
                  error={formErrors.state}
                />

                <Input
                  label="District / City"
                  name="district"
                  value={formData.district}
                  onChange={handleInputChange}
                  placeholder="e.g. Sindhudurg / Ratnagiri"
                  required
                  error={formErrors.district}
                />

                <div className="full-col">
                  <Textarea
                    label="Previous Environmental Projects (Optional)"
                    name="previousProjects"
                    value={formData.previousProjects}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="List past mangrove, seagrass, or wetland plantation projects (e.g. 50 hectares planted in 2021)..."
                    hint="Past track record of conservation and tree survival rates"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Review & Confirm */}
          {activeStep === 2 && (
            <div className="step-panel">
              <div className="step-panel-intro">
                <h3>Review Organization Profile</h3>
                <p>Verify all entered information before linking this profile to your connected wallet.</p>
              </div>

              {/* Wallet Identity Box */}
              <div className="review-identity-card">
                <div className="ric-left">
                  <ShieldCheck size={24} className="ric-icon" />
                  <div>
                    <strong>Connected Wallet Identity</strong>
                    <p className="ric-address">{userAddress}</p>
                  </div>
                </div>
                <span className="ric-badge">Decentralized ID</span>
              </div>

              {/* Summary Sections */}
              <div className="review-summary-grid">
                <div className="review-block">
                  <div className="rb-header">
                    <h4>Organization Overview</h4>
                    <button type="button" className="rb-edit-btn" onClick={() => setActiveStep(0)}>
                      Edit
                    </button>
                  </div>
                  <div className="rb-rows">
                    <div><span>Name:</span> <strong>{formData.organizationName}</strong></div>
                    <div><span>Reg. Number:</span> <strong>{formData.registrationNumber}</strong></div>
                    <div><span>Type:</span> <strong>{formData.organizationType}</strong></div>
                    <div><span>Established:</span> <strong>{formData.yearEstablished}</strong></div>
                  </div>
                </div>

                <div className="review-block">
                  <div className="rb-header">
                    <h4>Contact Details</h4>
                    <button type="button" className="rb-edit-btn" onClick={() => setActiveStep(0)}>
                      Edit
                    </button>
                  </div>
                  <div className="rb-rows">
                    <div><span>Email:</span> <strong>{formData.officialEmail}</strong></div>
                    <div><span>Phone:</span> <strong>{formData.contactNumber}</strong></div>
                    <div><span>Website:</span> <strong>{formData.website || 'None'}</strong></div>
                  </div>
                </div>

                <div className="review-block">
                  <div className="rb-header">
                    <h4>Location</h4>
                    <button type="button" className="rb-edit-btn" onClick={() => setActiveStep(1)}>
                      Edit
                    </button>
                  </div>
                  <div className="rb-rows">
                    <div><span>State:</span> <strong>{formData.state}</strong></div>
                    <div><span>District:</span> <strong>{formData.district}</strong></div>
                  </div>
                </div>

                <div className="review-block full-width">
                  <div className="rb-header">
                    <h4>Mission & Ecological Scope</h4>
                    <button type="button" className="rb-edit-btn" onClick={() => setActiveStep(1)}>
                      Edit
                    </button>
                  </div>
                  <div className="rb-rows">
                    <div><span>Description:</span> <p>{formData.description}</p></div>
                    <div><span>Mission:</span> <p>{formData.mission}</p></div>
                    <div><span>Areas of Work:</span> <strong>{formData.areasOfWork}</strong></div>
                    {formData.previousProjects && (
                      <div><span>Previous Projects:</span> <p>{formData.previousProjects}</p></div>
                    )}
                  </div>
                </div>
              </div>

              <div className="review-disclaimer">
                <AlertCircle size={16} />
                <span>
                  By completing onboarding, this organization profile will be stored under your wallet address. You will be authorized to submit blue carbon restoration projects for MRV analysis and validator review.
                </span>
              </div>
            </div>
          )}
        </StepWizard>
      </div>
    </div>
  );
};

export default NGOOnboarding;
