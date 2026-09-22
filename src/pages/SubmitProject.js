import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import {
  createProject,
  updateProject,
  uploadProjectEvidence,
  prepareEvidenceMetadata,
  saveProjectBaseline,
  getProjects,
  getProjectBaseline,
  extractEvidenceFromProject
} from '../services/projectService';
import { getNGOProfile } from '../services/ngoService';
import StepWizard from '../components/StepWizard';
import LocationPicker from '../components/LocationPicker';
import EvidenceUpload from '../components/EvidenceUpload';
import BaselineDataForm from '../components/BaselineDataForm';
import SubmissionReadiness from '../components/SubmissionReadiness';
import ProjectLifecycle from '../components/ProjectLifecycle';
import AnalysisZoneMap from '../components/AnalysisZoneMap';
import { formatProjectId } from '../utils/projectStatus';
import {
  Button,
  Input,
  Select,
  Textarea
} from '../components/ui';
import {
  FileText,
  MapPin,
  TreePine,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Save,
  Trash2,
  Building2,
  Eye,
  Activity
} from 'lucide-react';
import './SubmitProject.css';

import {
  formatCoordinate,
  formatRadius,
  estimateZoneAreaHectares,
  DEFAULT_ANALYSIS_RADIUS_METERS
} from '../utils/geoUtils';

const PLANTATION_TYPES = [
  { value: 'Mangrove', label: 'Mangrove' },
  { value: 'Seagrass', label: 'Seagrass' },
  { value: 'Salt Marsh', label: 'Salt Marsh' },
  { value: 'Tidal Wetland', label: 'Tidal Wetland' },
  { value: 'Kelp Forest', label: 'Kelp Forest' },
  { value: 'Other', label: 'Other' },
];

const LAND_TYPES = [
  { value: 'Coastal/Forest Area', label: 'Coastal / Forest Wetland Area' },
  { value: 'Community', label: 'Community Land' },
  { value: 'Government', label: 'Government / Forest Reserve' },
  { value: 'Private', label: 'Private Land' },
  { value: 'Other', label: 'Other' },
];

const INITIAL_FORM_STATE = {
  // Step 1: Project Info
  projectName: '',
  description: '',
  plantationType: 'Mangrove',
  startDate: '',

  // Step 2: Location & Analysis Zone
  locationName: '',
  latitude: '',
  longitude: '',
  analysisRadius: DEFAULT_ANALYSIS_RADIUS_METERS,
  analysisZoneType: 'circular',

  // Step 3: Land & Plantation
  areaHectares: '',
  landType: 'Coastal/Forest Area',
  ownershipControl: '',
  landDescription: '',
  saplingsPlanted: '',
  plantingDate: '',
  vegetationCondition: 'Degraded coastal wetland / Sparse mangrove cover',
  plantationMethod: 'Direct seedling planting & nursery sapling transfer',

  // Step 4: Evidence files
  evidenceFiles: [],

  // Step 5: Baseline Environmental Data (Phase 8)
  baselineData: {
    projectArea: '',
    ecosystemType: 'Mangrove Forest',
    mangroveCategory: 'Rhizophora (Red Mangrove)',
    restorationType: 'Reforestation',
    monitoringStartDate: '',
    assessmentDate: '',
    vegetationCondition: 'Moderate',
    biomass: '42.5',
    carbonStock: '68.2',
    soilCarbon: '110.0',
    sequestrationRate: '3.4',
    notes: '',
  },
};

const SubmitProject = () => {
  const { userAddress, connectWallet, loading: walletLoading } = useWeb3();
  const { role, ROLES, setShowRoleSelector } = useRole();

  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [stepErrorNotice, setStepErrorNotice] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [draftNotice, setDraftNotice] = useState(false);

  const [searchParams] = useSearchParams();
  const editProjectId = searchParams.get('projectId');
  const targetStepParam = searchParams.get('step');
  const [isEditMode, setIsEditMode] = useState(false);

  const ngoProfile = useMemo(() => getNGOProfile(userAddress), [userAddress]);

  const draftStorageKey = useMemo(() => {
    if (!userAddress) return null;
    return `bluechain_project_draft_${userAddress.toLowerCase()}`;
  }, [userAddress]);

  // Load existing project data if editing via deep-link (e.g. /ngo/submit?projectId=XYZ&step=5)
  useEffect(() => {
    if (editProjectId) {
      getProjects().then((allProjects) => {
        const found = allProjects.find((p) => (p.projectId || p._id || '').toString() === editProjectId.toString());
        if (found) {
          setIsEditMode(true);
          const bl = getProjectBaseline(editProjectId) || {};
          const ev = extractEvidenceFromProject(found) || [];
          
          let lat = found.latitude || '';
          let lng = found.longitude || '';
          if ((!lat || !lng) && found.location) {
            const match = found.location.match(/\(([-+]?\d*\.?\d+),\s*([-+]?\d*\.?\d+)\)/);
            if (match) { lat = match[1]; lng = match[2]; }
          }

          setFormData((prev) => ({
            ...prev,
            projectName: found.projectName || prev.projectName,
            description: found.description || prev.description,
            plantationType: found.plantationType || prev.plantationType,
            locationName: found.location || prev.locationName,
            latitude: lat || prev.latitude,
            longitude: lng || prev.longitude,
            saplingsPlanted: found.saplingsPlanted || prev.saplingsPlanted,
            areaHectares: bl.projectArea || prev.areaHectares,
            evidenceFiles: ev.length > 0 ? ev : prev.evidenceFiles,
            baselineData: {
              ...prev.baselineData,
              projectArea: bl.projectArea || prev.baselineData.projectArea,
              biomass: bl.biomass || prev.baselineData.biomass,
              carbonStock: bl.carbonStock || prev.baselineData.carbonStock,
              soilCarbon: bl.soilCarbon || prev.baselineData.soilCarbon,
              sequestrationRate: bl.sequestrationRate || prev.baselineData.sequestrationRate,
            }
          }));

          if (targetStepParam) {
            const stepNum = parseInt(targetStepParam, 10);
            if (!isNaN(stepNum) && stepNum >= 1 && stepNum <= 6) {
              setActiveStep(stepNum - 1);
            }
          }
        }
      }).catch((err) => {
        console.warn('Failed to load project for edit mode:', err);
      });
    }
  }, [editProjectId, targetStepParam]);

  // Load saved draft on mount if available (only when not in edit mode)
  useEffect(() => {
    if (draftStorageKey && !editProjectId) {
      try {
        const savedDraft = localStorage.getItem(draftStorageKey);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed && parsed.projectName) {
            setFormData(parsed);
            setDraftNotice(true);
          }
        }
      } catch (err) {
        console.warn('Could not load project draft:', err);
      }
    }
  }, [draftStorageKey, editProjectId]);

  const handleSaveDraft = useCallback(() => {
    if (!draftStorageKey) return;
    try {
      localStorage.setItem(draftStorageKey, JSON.stringify(formData));
    } catch (err) {
      console.warn('Failed to save project draft:', err);
    }
  }, [draftStorageKey, formData]);

  const handleClearDraft = () => {
    if (draftStorageKey) {
      localStorage.removeItem(draftStorageKey);
    }
    setFormData(INITIAL_FORM_STATE);
    setDraftNotice(false);
    setStepErrorNotice('');
    setActiveStep(0);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setStepErrorNotice('');
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = (lat, lng) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }));
    setStepErrorNotice('');
    if (formErrors.latitude || formErrors.longitude) {
      setFormErrors((prev) => ({ ...prev, latitude: '', longitude: '' }));
    }
  };

  const handleRadiusChange = (radius) => {
    setFormData((prev) => ({ ...prev, analysisRadius: radius }));
  };

  const handleEvidenceChange = (files) => {
    setFormData((prev) => ({ ...prev, evidenceFiles: files }));
  };

  const handleBaselineChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      baselineData: {
        ...prev.baselineData,
        [field]: value,
      },
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Step Validation Logic
  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      if (!formData.projectName.trim()) {
        errors.projectName = 'Project name is required';
      }
      if (!formData.plantationType) {
        errors.plantationType = 'Please select a plantation / ecosystem type';
      }
      if (!formData.description.trim()) {
        errors.description = 'Project description is required';
      } else if (formData.description.trim().length < 20) {
        errors.description = 'Please provide a more descriptive summary (at least 20 characters)';
      }
      if (!formData.startDate) {
        errors.startDate = 'Project start date is required';
      }
    }

    if (stepIndex === 1) {
      if (!formData.locationName.trim()) {
        errors.locationName = 'Location name / region is required';
      }
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        errors.latitude = 'Please select a valid latitude on the map (-90 to 90)';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        errors.longitude = 'Please select a valid longitude on the map (-180 to 180)';
      }
    }

    if (stepIndex === 2) {
      const area = parseFloat(formData.areaHectares);
      if (isNaN(area) || area <= 0) {
        errors.areaHectares = 'Please enter a valid positive project area in hectares';
      }
      const saplings = parseInt(formData.saplingsPlanted, 10);
      if (isNaN(saplings) || saplings <= 0) {
        errors.saplingsPlanted = 'Please enter a positive whole number of saplings';
      }
      if (!formData.ownershipControl.trim()) {
        errors.ownershipControl = 'Land ownership or management authorization details are required';
      }
    }

    // Step 3 (Evidence) is optional but recommended

    if (stepIndex === 4) {
      const bArea = parseFloat(formData.baselineData?.projectArea || formData.areaHectares);
      if (isNaN(bArea) || bArea <= 0) {
        errors.projectArea = 'Valid baseline project area (ha) is required';
      }
    }

    // Step 5 (Review) has no direct field validations

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setStepErrorNotice('');
      handleSaveDraft();
      setActiveStep((prev) => Math.min(prev + 1, 5));
    } else {
      setStepErrorNotice('Please resolve all highlighted field errors in this step before continuing.');
    }
  };

  const handlePrev = () => {
    setStepErrorNotice('');
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(4)) {
      setSubmitError('Please resolve all validation errors in previous steps before submitting.');
      return;
    }

    if (!userAddress) {
      setSubmitError('Please connect your MetaMask wallet to submit this project.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // 1. Submit main project form data to /form
      const locationString = formData.locationName
        ? `${formData.locationName} (${formData.latitude}, ${formData.longitude})`
        : `${formData.latitude}, ${formData.longitude}`;

      const ngoIdentifier = ngoProfile?.registrationNumber
        || ngoProfile?.organizationName
        || `NGO-${userAddress.substring(2, 8).toUpperCase()}`;

      const rawImageBase64s = formData.evidenceFiles
        .filter((f) => f.base64 && typeof f.base64 === 'string' && f.base64.length > 50)
        .map((f) => f.base64);

      let targetProjectId = editProjectId;

      const finalBaseline = {
        projectArea: parseFloat(formData.baselineData?.projectArea || formData.areaHectares || 25),
        ecosystemType: formData.baselineData?.ecosystemType || `${formData.plantationType} Forest`,
        mangroveCategory: formData.baselineData?.mangroveCategory || 'Rhizophora (Red Mangrove)',
        restorationType: formData.baselineData?.restorationType || 'Reforestation',
        monitoringStartDate: formData.baselineData?.monitoringStartDate || formData.startDate || new Date().toISOString().split('T')[0],
        assessmentDate: formData.baselineData?.assessmentDate || formData.plantingDate || new Date().toISOString().split('T')[0],
        vegetationCondition: formData.baselineData?.vegetationCondition || 'Moderate',
        biomass: parseFloat(formData.baselineData?.biomass || 42.5),
        carbonStock: parseFloat(formData.baselineData?.carbonStock || 68.2),
        soilCarbon: parseFloat(formData.baselineData?.soilCarbon || 110.0),
        sequestrationRate: parseFloat(formData.baselineData?.sequestrationRate || 3.4),
        notes: formData.baselineData?.notes || formData.landDescription || '',
      };

      if (isEditMode && targetProjectId) {
        await updateProject(targetProjectId, {
          projectName: formData.projectName.trim(),
          description: formData.description.trim(),
          location: locationString,
          plantationType: formData.plantationType,
          saplingsPlanted: parseInt(formData.saplingsPlanted, 10),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          analysisRadius: parseFloat(formData.analysisRadius || 2500),
          areaHectares: parseFloat(formData.areaHectares || 25),
          baselineData: finalBaseline,
          evidence: formData.evidenceFiles,
          imageBase64s: rawImageBase64s,
        });
      } else {
        const res = await createProject({
          ngoId: ngoIdentifier,
          projectName: formData.projectName.trim(),
          description: formData.description.trim(),
          location: locationString,
          plantationType: formData.plantationType,
          saplingsPlanted: parseInt(formData.saplingsPlanted, 10),
          walletAddress: userAddress,
          price: 0,
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          analysisRadius: parseFloat(formData.analysisRadius || 2500),
          areaHectares: parseFloat(formData.areaHectares || 25),
          baselineData: finalBaseline,
          evidence: formData.evidenceFiles,
          imageBase64s: rawImageBase64s,
        });
        targetProjectId = res.projectId;
      }

      // 2. Sync evidence via /upload-base64/:projectId
      if (targetProjectId && formData.evidenceFiles.length > 0) {
        try {
          await uploadProjectEvidence(targetProjectId, formData.evidenceFiles);
        } catch (imgErr) {
          console.warn('Evidence upload sync warning:', imgErr);
        }
      }

      // 3. Save Baseline Data in MongoDB
      if (targetProjectId) {
        await saveProjectBaseline(targetProjectId, finalBaseline);
      }

      // 5. Clear draft from localStorage
      if (draftStorageKey) {
        localStorage.removeItem(draftStorageKey);
      }

      setSubmitSuccess({
        projectId: targetProjectId,
        projectName: formData.projectName,
        location: locationString,
        saplings: parseInt(formData.saplingsPlanted, 10),
        plantationType: formData.plantationType,
      });
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmitError(
        err.response?.data?.message || 'Failed to submit project. Please try again or check backend connectivity.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step definitions for the StepWizard (6 steps in Phase 8)
  const wizardSteps = [
    { key: 'info', label: 'Project Info', icon: <FileText size={16} /> },
    { key: 'location', label: 'Location & Map', icon: <MapPin size={16} /> },
    { key: 'land', label: 'Land & Scope', icon: <TreePine size={16} /> },
    { key: 'evidence', label: 'Evidence Files', icon: <UploadCloud size={16} /> },
    { key: 'baseline', label: 'Starting measurements', icon: <Activity size={16} /> },
    { key: 'review', label: 'Review & Submit', icon: <CheckCircle2 size={16} /> },
  ];

  // 1. Disconnected Wallet State
  if (!userAddress) {
    return (
      <div className="submit-page-container">
        <div className="submit-access-card">
          <div className="sac-icon-badge">
            <ShieldCheck size={36} className="text-primary" />
          </div>
          <h2>Connect Wallet to Register a Project</h2>
          <p>
            Connect your own wallet so the project and its future demo tokens can be linked to you. No payment is required.
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

  // 2. Role Restriction (NGO and Admin only)
  if (!role || (role !== ROLES.NGO && role !== ROLES.ADMIN)) {
    return (
      <div className="submit-page-container">
        <div className="submit-access-card">
          <div className="sac-icon-badge warning">
            <AlertCircle size={36} />
          </div>
          <h2>NGO Access Required</h2>
          <p>
            Project registration is reserved for <strong>NGO Project Developers</strong>. You are currently signed in with the role of <strong>{role}</strong>.
          </p>
          <div className="sac-actions">
            <button onClick={() => setShowRoleSelector(true)} className="bc-btn bc-btn--secondary">
              Choose NGO role
            </button>
            <Link to="/dashboard" className="bc-btn bc-btn--ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Success Screen
  if (submitSuccess) {
    const formattedId = formatProjectId(submitSuccess.projectId);
    return (
      <div className="submit-page-container">
        <div className="submit-success-card">
          <div className="ssc-icon-badge">
            <Sparkles size={42} />
          </div>
          <h2>Project Submitted Successfully!</h2>
          <p className="ssc-subtitle">
            Your blue carbon restoration project <strong>"{submitSuccess.projectName}"</strong> has been saved. Next, open the project and run its checks. A validator will review the findings before tokens can be issued.
          </p>

          <div className="ssc-details-box">
            <div className="ssc-detail-row">
              <span>Project Identifier:</span>
              <code className="ssc-id-code">{formattedId}</code>
            </div>
            <div className="ssc-detail-row">
              <span>Current Status:</span>
              <span className="ssc-status-badge">Submitted · ready for checks</span>
            </div>
            <div className="ssc-detail-row">
              <span>Location:</span>
              <strong>{submitSuccess.location}</strong>
            </div>
            <div className="ssc-detail-row">
              <span>Plantation Scope:</span>
              <strong>{submitSuccess.saplings?.toLocaleString()} {submitSuccess.plantationType} trees</strong>
            </div>
          </div>

          {/* Full Lifecycle Progression */}
          <div className="ssc-lifecycle-section">
            <h4>What happens next</h4>
            <ProjectLifecycle project={{ status: 'submitted' }} compact={false} />
          </div>

          <div className="ssc-actions">
            {submitSuccess.projectId && (
              <Link to={`/project/${submitSuccess.projectId}`} className="bc-btn bc-btn--primary">
                <Eye size={16} /> Continue to project checks
              </Link>
            )}
            <Link to="/ngo/projects" className="bc-btn bc-btn--secondary">
              Go to My Projects
            </Link>
            <Link to="/" className="bc-btn bc-btn--outline">
              Return to Dashboard
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setSubmitSuccess(null);
                setFormData(INITIAL_FORM_STATE);
                setActiveStep(0);
              }}
            >
              + Register Another Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. Registration Wizard Form
  return (
    <div className="submit-page-container">
      {/* Header */}
      <header className="submit-page-header">
        <div>
          <h1>Submit a project</h1>
          <p>Add the project details and evidence. After submitting, follow checks, review and token issuance on one project page.</p>
        </div>
        {draftStorageKey && (
          <div className="draft-actions">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              icon={<Save size={14} />}
            >
              Save Draft
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              icon={<Trash2 size={14} />}
            >
              Clear
            </Button>
          </div>
        )}
      </header>

      {/* Draft Notification Banner */}
      {draftNotice && (
        <div className="draft-notice-banner">
          <Sparkles size={16} />
          <span>Draft restored from local session. You can continue where you left off.</span>
        </div>
      )}

      {/* Main Multi-Step Form */}
      <div className="submit-wizard-card">
        <StepWizard
          steps={wizardSteps}
          activeStep={activeStep}
          onStepClick={(stepIndex) => {
            if (stepIndex < activeStep || validateStep(activeStep)) {
              handleSaveDraft();
              setActiveStep(stepIndex);
            }
          }}
          onNext={handleNext}
          onPrev={handlePrev}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Submit Project for Review"
          submitError={submitError}
        >
          {stepErrorNotice && (
            <div className="submit-step-error-alert" style={{ marginBottom: 20, padding: '12px 16px', backgroundColor: '#fce8e6', border: '1px solid #f5c2c7', color: '#c5221f', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
              <AlertCircle size={18} />
              <span>{stepErrorNotice}</span>
            </div>
          )}

          {/* STEP 1: Basic Project Info */}
          {activeStep === 0 && (
            <div className="reg-step-panel">
              <div className="reg-step-intro">
                <h3>Step 1: Basic Project Information</h3>
                <p>Provide foundational identity and operational scope for your blue carbon initiative.</p>
              </div>

              <div className="reg-fields-grid">
                <div className="full-col">
                  <Input
                    label="Project Name"
                    name="projectName"
                    value={formData.projectName}
                    onChange={handleInputChange}
                    placeholder="e.g. Sundarbans Mangrove Conservation Plot Alpha"
                    required
                    error={formErrors.projectName}
                  />
                </div>

                <Select
                  label="Plantation / Ecosystem Type"
                  name="plantationType"
                  value={formData.plantationType}
                  onChange={handleInputChange}
                  options={PLANTATION_TYPES}
                  required
                  error={formErrors.plantationType}
                />

                <Input
                  label="Project Launch / Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                  error={formErrors.startDate}
                />

                <div className="full-col">
                  <Textarea
                    label="Detailed Project Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the historical degradation, community involvement, restoration methodology, target tidal zones, and long-term carbon sequestration expectations..."
                    rows={4}
                    required
                    error={formErrors.description}
                    hint="A comprehensive summary for DAO validators to review (min 20 characters)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Location & Analysis Zone */}
          {activeStep === 1 && (
            <div className="reg-step-panel">
              <div className="reg-step-intro">
                <h3>Step 2: Location & Analysis Zone</h3>
                <p>Select your exact mangrove restoration site and define the circular satellite monitoring zone.</p>
              </div>

              <div className="reg-fields-grid location-fields-override">
                <div className="full-col">
                  <Input
                    label="Location / Region Name"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    placeholder="e.g. Mahim Creek Mangrove Estuary, Mumbai"
                    required
                    error={formErrors.locationName}
                    hint="Common geographic identifier or coastal reserve title"
                  />
                </div>
              </div>

              <LocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                radiusMeters={formData.analysisRadius}
                onChange={handleLocationChange}
                onLocationChange={handleLocationChange}
                onRadiusChange={handleRadiusChange}
                error={formErrors.latitude || formErrors.longitude}
              />
            </div>
          )}

          {/* STEP 3: Land & Plantation Details */}
          {activeStep === 2 && (
            <div className="reg-step-panel">
              <div className="reg-step-intro">
                <h3>Step 3: Land & Project Scope</h3>
                <p>Record land tenure, estimated acreage, and sapling quantities for on-chain credit minting.</p>
              </div>

              <div className="reg-fields-grid">
                <Input
                  label="Project Area (Hectares)"
                  name="areaHectares"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.areaHectares}
                  onChange={handleInputChange}
                  placeholder="e.g. 25.5"
                  required
                  error={formErrors.areaHectares}
                  hint="Measured restoration area within the analysis zone"
                />

                <Select
                  label="Land Ownership / Tenure Type"
                  name="landType"
                  value={formData.landType}
                  onChange={handleInputChange}
                  options={LAND_TYPES}
                  required
                />

                <div className="full-col">
                  <Input
                    label="Land Management / Ownership Authority"
                    name="ownershipControl"
                    value={formData.ownershipControl}
                    onChange={handleInputChange}
                    placeholder="e.g. State Forest Department MOU & Coastal Community Trust"
                    required
                    error={formErrors.ownershipControl}
                    hint="Governing legal entity or community rights agreements"
                  />
                </div>

                <Input
                  label="Total Saplings Planted"
                  name="saplingsPlanted"
                  type="number"
                  min="1"
                  value={formData.saplingsPlanted}
                  onChange={handleInputChange}
                  placeholder="e.g. 15000"
                  required
                  error={formErrors.saplingsPlanted}
                  hint="Eligible for tokenized BCT credit consideration upon verification"
                />

                <Input
                  label="Approximate Planting Date"
                  name="plantingDate"
                  type="date"
                  value={formData.plantingDate || formData.startDate}
                  onChange={handleInputChange}
                  hint="Date when restoration or sapling plantation commenced"
                />
              </div>
            </div>
          )}

          {/* STEP 4: Evidence */}
          {activeStep === 3 && (
            <div className="reg-step-panel">
              <div className="reg-step-intro">
                <h3>Step 4: Project Evidence & Field Documentation</h3>
                <p>Upload supporting field photographs, boundary geotag files, or permission letters.</p>
              </div>

              <EvidenceUpload
                files={formData.evidenceFiles}
                onChange={handleEvidenceChange}
                maxFiles={6}
                maxSizeMB={5}
              />
            </div>
          )}

          {/* STEP 5: Baseline Environmental Data (Phase 8) */}
          {activeStep === 4 && (
            <div className="reg-step-panel">
              <div className="reg-step-intro">
                <h3>Step 5: Baseline Environmental & MRV Metrics</h3>
                <p>Define the pre-restoration biomass, carbon stocks, and ecosystem baseline metrics for MRV tracking.</p>
              </div>

              <BaselineDataForm
                data={{
                  projectArea: formData.baselineData?.projectArea || formData.areaHectares || '',
                  ecosystemType: formData.baselineData?.ecosystemType || `${formData.plantationType} Forest`,
                  mangroveCategory: formData.baselineData?.mangroveCategory || 'Rhizophora (Red Mangrove)',
                  restorationType: formData.baselineData?.restorationType || 'Reforestation',
                  monitoringStartDate: formData.baselineData?.monitoringStartDate || formData.startDate || '',
                  assessmentDate: formData.baselineData?.assessmentDate || formData.plantingDate || '',
                  vegetationCondition: formData.baselineData?.vegetationCondition || 'Moderate',
                  biomass: formData.baselineData?.biomass || '42.5',
                  carbonStock: formData.baselineData?.carbonStock || '68.2',
                  soilCarbon: formData.baselineData?.soilCarbon || '110.0',
                  sequestrationRate: formData.baselineData?.sequestrationRate || '3.4',
                  notes: formData.baselineData?.notes || '',
                }}
                onChange={handleBaselineChange}
                errors={formErrors}
              />
            </div>
          )}

          {/* STEP 6: Review & Submit (Phase 9) */}
          {activeStep === 5 && (
            <div className="reg-step-panel">
              <div className="reg-step-intro">
                <h3>Step 6: Review Submission & Readiness Audit</h3>
                <p>Review all project information and verify the readiness checklist before final submission.</p>
              </div>

              {/* Linked NGO Identity Card */}
              <div className="review-ngo-card">
                <div className="rnc-left">
                  <Building2 size={24} className="rnc-icon" />
                  <div>
                    <strong>{ngoProfile?.organizationName || 'NGO Project Steward'}</strong>
                    <span className="rnc-meta">
                      {ngoProfile?.registrationNumber ? `Reg #${ngoProfile.registrationNumber} • ` : ''}
                      Wallet: <code className="rnc-wallet">{userAddress}</code>
                    </span>
                  </div>
                </div>
                <span className="rnc-badge">Steward Identity</span>
              </div>

              {/* Submission Readiness Checklist (Phase 9) */}
              <SubmissionReadiness
                formData={formData}
                onJumpToStep={(stepIdx) => setActiveStep(stepIdx)}
              />

              {/* Categorized Review Blocks */}
              <div className="review-cards-grid">
                {/* 1. Project Info */}
                <div className="review-summary-card">
                  <div className="rsc-header">
                    <h4><FileText size={16} /> Section 1: Project Information</h4>
                    <button type="button" className="rsc-edit-btn" onClick={() => setActiveStep(0)}>
                      Edit
                    </button>
                  </div>
                  <div className="rsc-rows">
                    <div><span>Name:</span> <strong>{formData.projectName}</strong></div>
                    <div><span>Ecosystem:</span> <strong>{formData.plantationType}</strong></div>
                    <div><span>Start Date:</span> <strong>{formData.startDate}</strong></div>
                    <div><span>Description:</span> <p>{formData.description}</p></div>
                  </div>
                </div>

                {/* 2. Location */}
                <div className="review-summary-card">
                  <div className="rsc-header">
                    <h4><MapPin size={16} /> Section 2: Location & Analysis Zone</h4>
                    <button type="button" className="rsc-edit-btn" onClick={() => setActiveStep(1)}>
                      Edit
                    </button>
                  </div>
                  <div className="rsc-rows">
                    <div><span>Location:</span> <strong>{formData.locationName}</strong></div>
                    <div><span>Coordinates:</span> <code>{formatCoordinate(formData.latitude, 'lat')}, {formatCoordinate(formData.longitude, 'lng')}</code></div>
                    <div><span>Analysis Zone:</span> <span>{formatRadius(formData.analysisRadius)} circular monitoring radius (~{estimateZoneAreaHectares(formData.analysisRadius)} ha)</span></div>
                  </div>
                  {formData.latitude && formData.longitude && (
                    <div className="review-map-preview-wrap">
                      <AnalysisZoneMap
                        latitude={formData.latitude}
                        longitude={formData.longitude}
                        radius={formData.analysisRadius}
                        projectName={formData.projectName || 'New Project'}
                        locationName={formData.locationName}
                      />
                    </div>
                  )}
                </div>

                {/* 3. Land & Plantation */}
                <div className="review-summary-card">
                  <div className="rsc-header">
                    <h4><TreePine size={16} /> Section 3: Land & Scope</h4>
                    <button type="button" className="rsc-edit-btn" onClick={() => setActiveStep(2)}>
                      Edit
                    </button>
                  </div>
                  <div className="rsc-rows">
                    <div><span>Area:</span> <strong>{formData.areaHectares} Hectares</strong></div>
                    <div><span>Land Type:</span> <strong>{formData.landType}</strong></div>
                    <div><span>Ownership:</span> <strong>{formData.ownershipControl}</strong></div>
                    <div><span>Saplings:</span> <strong>{parseInt(formData.saplingsPlanted, 10)?.toLocaleString()} trees</strong></div>
                  </div>
                </div>

                {/* 4. Evidence */}
                <div className="review-summary-card">
                  <div className="rsc-header">
                    <h4><UploadCloud size={16} /> Section 4: Attached Evidence ({formData.evidenceFiles.length})</h4>
                    <button type="button" className="rsc-edit-btn" onClick={() => setActiveStep(3)}>
                      Edit
                    </button>
                  </div>
                  <div className="rsc-rows">
                    {formData.evidenceFiles.length > 0 ? (
                      <>
                        <div className="rsc-evidence-breakdown">
                          {(() => {
                            const summary = prepareEvidenceMetadata(formData.evidenceFiles);
                            return (
                              <div className="evidence-summary-tags">
                                {summary.sitePhotos > 0 && <span className="cat-tag">Site Photos: {summary.sitePhotos}</span>}
                                {summary.beforeAfter > 0 && <span className="cat-tag">Before/After: {summary.beforeAfter}</span>}
                                {summary.fieldSurveys > 0 && <span className="cat-tag">Field Surveys: {summary.fieldSurveys}</span>}
                                {summary.permissions > 0 && <span className="cat-tag">Permissions: {summary.permissions}</span>}
                                {summary.ngoDocs > 0 && <span className="cat-tag">NGO Docs: {summary.ngoDocs}</span>}
                                {summary.other > 0 && <span className="cat-tag">Other: {summary.other}</span>}
                              </div>
                            );
                          })()}
                        </div>
                        <div className="review-evidence-thumbs">
                          {formData.evidenceFiles.map((f) => (
                            <span key={f.id} className="thumb-item" title={`${f.name} (${f.category})`}>
                              {f.isImage ? <img src={f.base64} alt={f.name} /> : <span className="pdf-thumb-label"><FileText size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} /> PDF</span>}
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="no-evidence-hint">No supporting evidence attached. You can continue, but providing evidence aids validator review.</p>
                    )}
                  </div>
                </div>

                {/* 5. Baseline Environmental Metrics (Phase 8) */}
                <div className="review-summary-card">
                  <div className="rsc-header">
                    <h4><Activity size={16} /> Section 5: Baseline Environmental Data</h4>
                    <button type="button" className="rsc-edit-btn" onClick={() => setActiveStep(4)}>
                      Edit
                    </button>
                  </div>
                  <div className="rsc-rows">
                    <div><span>Project Area:</span> <strong>{formData.baselineData?.projectArea || formData.areaHectares} ha</strong></div>
                    <div><span>Baseline Biomass:</span> <strong>{formData.baselineData?.biomass || '42.5'} t/ha</strong></div>
                    <div><span>Carbon Stock Pool:</span> <strong>{formData.baselineData?.carbonStock || '68.2'} tCO₂e</strong></div>
                    <div><span>Soil Carbon:</span> <strong>{formData.baselineData?.soilCarbon || '110.0'} tC/ha</strong></div>
                    <div><span>Sequestration Rate:</span> <strong>{formData.baselineData?.sequestrationRate || '3.4'} tCO₂e/yr</strong></div>
                    {formData.baselineData?.notes && (
                      <div><span>Field Notes:</span> <p>{formData.baselineData.notes}</p></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submission Transparency Note */}
              <div className="review-submit-notice">
                <ShieldCheck size={18} />
                <div>
                  <strong>Declaration of Authenticity & Next Steps:</strong>
                  <p>
                    By submitting, your project enters the decentralized verification queue with status <strong>Submitted</strong>. DAO certified validators will audit your coordinates, satellite analysis buffer, and evidence before consensus approval and on-chain credit minting.
                  </p>
                </div>
              </div>
            </div>
          )}
        </StepWizard>
      </div>
    </div>
  );
};

export default SubmitProject;
