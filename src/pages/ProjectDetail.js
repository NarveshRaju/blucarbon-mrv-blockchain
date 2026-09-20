import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import apiClient from '../services/api';
import SatelliteMLAudit from '../components/SatelliteMLAudit';
import MRVSummary from '../components/MRVSummary';
import ProjectLifecycle from '../components/ProjectLifecycle';
import ProjectActivityTimeline from '../components/ProjectActivityTimeline';
import { formatProjectId, getStatusConfig, normalizeStatus, getAvailableActions } from '../utils/projectStatus';
import { parseCoordinatesFromLocation } from '../utils/geoUtils';
import {
  extractEvidenceFromProject,
  getProjectBaseline,
  getProjectMRVRecords,
  addProjectMRVRecord,
  deriveMRVStatus,
  runAIVerification
} from '../services/projectService';
import AIVerificationResult from '../components/AIVerificationResult';
import { EmptyState, Modal, Button } from '../components/ui';
import {
  FileText,
  Eye,
  Tag,
  X,
  ShieldCheck,
  Activity,
  MapPin,
  Sprout,
  Trees,
  Calendar,
  Globe,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { formatUnits, parseUnits } from 'ethers';
import './ProjectDetail.css';

const AdminWalletInfo = () => {
  const { contract, userAddress } = useWeb3();
  const [balance, setBalance] = useState('0');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        if (!contract || !userAddress) return;
        const adminBalance = await contract.balanceOf(userAddress);
        setBalance(formatUnits(adminBalance, 18));
      } catch (err) {
        console.error("Failed to fetch admin balance:", err);
      }
    };
    fetchBalance();
  }, [contract, userAddress]);

  return (
    <div className="admin-wallet-info">
      <h4>Admin Wallet</h4>
      <p>Your BCT Balance: <strong>{parseFloat(balance).toLocaleString()}</strong> BCT</p>
    </div>
  );
};

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { contract, isAdmin, userAddress } = useWeb3();
  const { role, ROLES } = useRole();

  const [project, setProject] = useState(null);
  const [baselineData, setBaselineData] = useState(null);
  const [mrvRecords, setMrvRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVoting, setIsVoting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);
  const [txMessage, setTxMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [selectedEvidenceImg, setSelectedEvidenceImg] = useState(null);

  const evidenceList = useMemo(() => extractEvidenceFromProject(project), [project]);

  const isValidator = role === ROLES.VALIDATOR || role === ROLES.ADMIN;
  const isNGO = role === ROLES.NGO;
  const isInvestor = role === ROLES.INVESTOR;
  const isProjectOwner = project && userAddress &&
    project.walletAddress?.toLowerCase() === userAddress.toLowerCase();

  const fetchProjectData = useCallback(() => {
    apiClient.get(`/forms/${projectId}`)
      .then(res => setProject(res.data))
      .catch(() => setError("Failed to fetch project details."))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Real-time event listener for on-chain approval
  useEffect(() => {
    if (contract && project) {
      const onApproval = (offChainId) => {
        if (offChainId === project._id) {
          setNotification('This project was just approved on-chain!');
          fetchProjectData();
        }
      };

      contract.on("ApprovalRecord", onApproval);
      return () => { contract.off("ApprovalRecord", onApproval); };
    }
  }, [contract, project, fetchProjectData]);

  // Handle voting (off-chain validator review)
  const handleVote = async (voteType) => {
    setIsVoting(true);
    setError(null);
    try {
      const newStatus = voteType === 'approve' ? 'dao_review' : 'validator_rejected';
      const response = await apiClient.patch(`/forms/${projectId}/status`, { status: newStatus });
      setProject(response.data.form || response.data);
      setNotification(voteType === 'approve'
        ? 'Project approved by validator! Advanced to DAO governance consensus review.'
        : 'Project rejected by validator. Revisions requested from NGO.');
      fetchProjectData();
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred while voting.");
    } finally {
      setIsVoting(false);
    }
  };

  // Handle token minting (on-chain by admin)
  const handleMintTokens = async () => {
    if (!contract || !project) return;

    setIsMinting(true);
    setTxMessage("Preparing transaction...");

    try {
      const recipientAddress = project.walletAddress;
      const tokenAmount = parseUnits(project.saplingsPlanted.toString(), 18);
      const offChainId = project._id;

      setTxMessage("Please confirm the transaction in your wallet...");
      const tx = await contract.mintAndRecordApproval(recipientAddress, tokenAmount, offChainId);

      setTxMessage("Transaction sent! Waiting for confirmation on Sepolia...");
      await tx.wait();

      // Persist status update to MongoDB
      await apiClient.patch(`/forms/${projectId}/status`, { status: 'credit_issued' });

      setTxMessage('');
      setNotification('BCT carbon credits minted successfully on Sepolia!');
      fetchProjectData();
    } catch (err) {
      console.error("Smart contract minting failed:", err);
      setTxMessage(`Error: ${err.message || "Transaction failed."}`);
    } finally {
      setIsMinting(false);
    }
  };

  // Load project Baseline data and MRV records (Phase 8)
  useEffect(() => {
    if (project) {
      const bl = getProjectBaseline(projectId, project);
      const mrv = getProjectMRVRecords(projectId, project);
      setBaselineData(bl);
      setMrvRecords(mrv);
    }
  }, [project, projectId]);

  const [showAIReportModal, setShowAIReportModal] = useState(false);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);

  const handleAddMRVRecord = async (newRecord) => {
    const saved = await addProjectMRVRecord(projectId, newRecord);
    if (saved) {
      setMrvRecords((prev) => [saved, ...prev]);
      setNotification('New MRV observation recorded successfully to MongoDB!');
      fetchProjectData();
      setTimeout(() => setNotification(''), 4000);
    }
  };

  const mrvStatus = useMemo(
    () => deriveMRVStatus(project, baselineData, mrvRecords),
    [project, baselineData, mrvRecords]
  );

  const [selectedRunReport, setSelectedRunReport] = useState(null);
  const [analyzingStepText, setAnalyzingStepText] = useState('');

  const statusConfig = useMemo(() => getStatusConfig(project), [project]);
  const normStatus = useMemo(() => normalizeStatus(project), [project]);
  const availableActions = useMemo(
    () => getAvailableActions(project, role, userAddress),
    [project, role, userAddress]
  );

  const isApproved = normStatus === 'approved' || normStatus === 'dao_approved' || normStatus === 'credit_issued';
  const projectGeo = parseCoordinatesFromLocation(project?.location);

  const aiReport = useMemo(() => {
    if (!project) return null;
    const dbAI = project.aiVerification;
    if (dbAI && dbAI.status && dbAI.status !== 'ai_pending' && dbAI.status !== 'ai_processing') {
      return dbAI;
    }
    return null;
  }, [project]);

  const handleRunAIPreVerification = async () => {
    if (!project) return;
    setIsAnalyzingAI(true);
    setError(null);
    setAnalyzingStepText('Executing cross-project authenticity and duplicate analysis...');

    try {
      const pid = project.projectId || project._id || projectId;
      const report = await runAIVerification(pid, userAddress);
      setNotification('AI Pre-Verification completed successfully!');
      setSelectedRunReport(report);
      fetchProjectData();
      setTimeout(() => setNotification(''), 4000);
    } catch (err) {
      console.error('Failed to run AI Pre-Verification:', err);
      setError('AI verification could not be completed. Please try again.');
    } finally {
      setIsAnalyzingAI(false);
      setAnalyzingStepText('');
    }
  };

  if (loading) return <div className="detail-loading"><p>Loading project details from MongoDB...</p></div>;
  if (error && !project) return <div className="detail-error"><p>{error}</p></div>;
  if (!project) return <div className="detail-error"><p>Project not found.</p></div>;

  return (
    <div className="project-detail-container">
      {notification && <div className="realtime-notification">{notification}</div>}

      <Link to={isValidator ? "/verification" : isNGO ? "/ngo/projects" : "/"} className="back-link">
        ← Back to {isValidator ? "Review Queue" : isNGO ? "My Projects" : "Dashboard"}
      </Link>

      {/* Project Status & Lifecycle Banner (Phase 9) */}
      <div className="detail-lifecycle-section">
        <ProjectLifecycle project={project} />
      </div>

      {/* AI Pre-Verification Section (Real Multi-Module Engine) */}
      {isAnalyzingAI || project?.aiVerification?.status === 'ai_processing' ? (
        /* STATE 2: AI Processing State */
        <div className="detail-ai-card processing" style={{ marginBottom: '1.5rem', padding: '1.5rem', borderRadius: '12px', border: '1px solid #93c5fd', background: '#eff6ff', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <BrainCircuit size={28} className="text-primary" style={{ animation: 'spin 2s linear infinite', flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#1e40af' }}>Automated AI Pre-Verification in Progress...</h4>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#3b82f6' }}>
              {analyzingStepText || 'Auditing project authenticity, geographic plausibility, SHA-256 evidence integrity, Sentinel-2 spectral data, and biophysical growth bounds.'}
            </p>
          </div>
        </div>
      ) : aiReport ? (
        /* STATE 3 & 4: AI Report Completed / Requires Correction */
        <div className={`detail-ai-card rec-${(aiReport.recommendation || 'flagged').toLowerCase()}`} style={{ marginBottom: '1.5rem', padding: '1.1rem 1.25rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="daic-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="daic-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={20} style={{ color: '#1a73e8' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>AI Pre-Verification Status</h4>
              {aiReport.runNumber && (
                <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: '#e2e8f0', color: '#334155' }}>
                  Run #{aiReport.runNumber}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.25rem 0.65rem',
                borderRadius: '999px',
                background: aiReport.recommendation === 'PASS' ? '#e6f4ea' : aiReport.recommendation === 'FLAGGED' ? '#fef7e0' : '#fce8e6',
                color: aiReport.recommendation === 'PASS' ? '#137333' : aiReport.recommendation === 'FLAGGED' ? '#b06000' : '#c5221f'
              }}
            >
              {aiReport.recommendationLabel || aiReport.recommendation}
            </span>
          </div>

          <div className="daic-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div className="daic-msg-row" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: '240px' }}>
              {aiReport.recommendation === 'PASS' && <CheckCircle2 size={18} style={{ color: '#34a853', flexShrink: 0 }} />}
              {aiReport.recommendation === 'FLAGGED' && <AlertTriangle size={18} style={{ color: '#fbbc05', flexShrink: 0 }} />}
              {aiReport.recommendation === 'FAIL' && <XCircle size={18} style={{ color: '#ea4335', flexShrink: 0 }} />}
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>{aiReport.recommendationMessage || 'Automated pre-screening analysis completed.'}</p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {isNGO && (aiReport.recommendation === 'FAIL' || aiReport.recommendation === 'FLAGGED') && (
                <Link to={`/ngo/submit?projectId=${project.projectId || project._id}&step=5`}>
                  <Button type="button" variant="primary" size="sm" icon={<Sparkles size={14} />}>
                    Fix Issues & Resubmit
                  </Button>
                </Link>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRunAIPreVerification}
                loading={isAnalyzingAI}
                loadingText="Re-verifying..."
                icon={<BrainCircuit size={14} />}
              >
                Re-run AI Verification
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedRunReport(aiReport);
                  setShowAIReportModal(true);
                }}
                icon={<Eye size={14} />}
              >
                Inspect Full AI Report
              </Button>
            </div>
          </div>
        </div>
      ) : statusConfig.stageIndex <= 1 && normStatus !== 'draft' ? (
        /* STATE 1: AI Pending Card ONLY when in Submitted / AI Pending stage */
        <div className="detail-ai-card pending" style={{ marginBottom: '1.5rem', padding: '1.25rem', borderRadius: '12px', border: '1px solid #cbd5e1', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="daic-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div className="daic-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BrainCircuit size={20} style={{ color: '#1a73e8' }} />
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>AI Pre-Verification Pending</h4>
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.65rem', borderRadius: '999px', background: '#e0f2fe', color: '#0369a1' }}>
              Status: Waiting for AI Analysis
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155' }}>
            Your project has been submitted to MongoDB and is queued for automated authenticity and biophysical pre-verification screening.
          </p>

          <div style={{ fontSize: '0.825rem', color: '#64748b', background: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <strong style={{ color: '#334155' }}>The Automated Pre-Verification Engine will evaluate:</strong>
            <span>&bull; Project authenticity & cross-project geographic buffer overlap</span>
            <span>&bull; Latitudinal biophysical bounds & land authorization documents</span>
            <span>&bull; Cryptographic SHA-256 evidence integrity & cross-project file reuse</span>
            <span>&bull; Sentinel-2 MSI spectral formulas (NDVI / EVI)</span>
            <span>&bull; Biophysical growth ceilings & silvicultural planting density</span>
            <span>&bull; Allometric biomass modeling & carbon stock accounting</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleRunAIPreVerification}
              loading={isAnalyzingAI}
              loadingText="Running Pre-Verification..."
              icon={<BrainCircuit size={14} />}
            >
              Start AI Pre-Verification
            </Button>
          </div>
        </div>
      ) : null}

      <div className="detail-header">
        <div>
          <span className="detail-proj-id">{formatProjectId(project._id || project.projectId || projectId)}</span>
          <h1>{project.projectName}</h1>
        </div>
        <div className="detail-badges-group">
          <span className={`detail-status-badge ${normStatus}`}>
            {project.status || "Pending"}
          </span>
          <span className={`mrv-lifecycle-pill ${mrvStatus.color}`}>
            <Activity size={12} /> MRV: {mrvStatus.label}
          </span>
        </div>
      </div>
      <p className="detail-organization">Submitted by: {project.ngoId || project.ngoName || 'NGO Partner'}</p>

      <div className="detail-grid">
        <div className="detail-card"><h4>Location</h4><p><MapPin size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.location}</p></div>
        <div className="detail-card"><h4>Plantation Type</h4><p><Sprout size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.plantationType}</p></div>
        <div className="detail-card"><h4>Saplings Planted</h4><p><Trees size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {project.saplingsPlanted?.toLocaleString()}</p></div>
        <div className="detail-card"><h4>Submitted On</h4><p><Calendar size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {new Date(project.createdAt).toLocaleDateString()}</p></div>
      </div>

      <div className="detail-description">
        <h3>Project Overview</h3>
        <p>{project.description || 'No description provided.'}</p>
      </div>

      {/* Project Location & Sentinel-2 ML Satellite Audit (Step 4) */}
      <div className="detail-location-zone">
        <SatelliteMLAudit
          latitude={project.latitude || (projectGeo && projectGeo.latitude) || 21.8450}
          longitude={project.longitude || (projectGeo && projectGeo.longitude) || 88.9210}
          claimedAreaHectares={project.areaHectares || project.baselineData?.projectArea || 250}
          initialRadius={project.analysisRadius ? (project.analysisRadius > 50 ? project.analysisRadius / 1000 : project.analysisRadius) : 5.0}
          projectName={project.projectName}
          plantationType={project.plantationType}
        />
      </div>

      {/* Project Evidence Gallery & Supporting Documents */}
      <div className="detail-evidence-section">
        <div className="des-header">
          <h3>Project Evidence & Verification Proof</h3>
          <span className="des-count-badge">
            {evidenceList.length} {evidenceList.length === 1 ? 'file' : 'files'} on record
          </span>
        </div>

        {evidenceList.length > 0 ? (
          <div className="detail-evidence-grid">
            {evidenceList.map((item, idx) => (
              <div key={item.id || idx} className="detail-evidence-card">
                {/* Visual / Thumbnail */}
                <div className="dec-preview">
                  {item.isImage ? (
                    <div
                      className="dec-img-wrap"
                      onClick={() => setSelectedEvidenceImg(item)}
                      title="Click to view full size"
                    >
                      <img src={item.base64} alt={item.name} />
                      <span className="dec-zoom-btn">
                        <Eye size={16} /> View
                      </span>
                    </div>
                  ) : (
                    <div className="dec-pdf-wrap">
                      <FileText size={36} className="text-danger" />
                      <span className="dec-pdf-badge">PDF DOCUMENT</span>
                    </div>
                  )}
                </div>

                {/* Meta details */}
                <div className="dec-meta">
                  <div className="dec-tag-row">
                    <span className="dec-category-tag">
                      <Tag size={11} /> {item.category || 'Site Photograph'}
                    </span>
                    {item.size > 0 && (
                      <span className="dec-size-tag">
                        {item.size < 1024 * 1024
                          ? `${(item.size / 1024).toFixed(1)} KB`
                          : `${(item.size / (1024 * 1024)).toFixed(1)} MB`}
                      </span>
                    )}
                  </div>
                  <strong className="dec-filename" title={item.name}>
                    {item.name}
                  </strong>
                  <span className="dec-status-text">
                    <ShieldCheck size={12} className="text-primary" /> {item.status || 'Available for Review'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText size={36} />}
            title="No Supporting Evidence"
            description="No field photographs, surveys, or documents were uploaded with this project submission."
          />
        )}
      </div>

      {/* Environmental Baseline & MRV Monitoring Section (Phase 8) */}
      <div className="detail-mrv-section">
        <MRVSummary
          baseline={baselineData}
          mrvRecords={mrvRecords}
          onAddMRVRecord={handleAddMRVRecord}
          canAddRecord={isValidator || isNGO || isAdmin}
          projectName={project.projectName}
        />
      </div>

      {/* Project Verification Activity Timeline & Audit Log (Phase 9) */}
      <div className="detail-activity-section">
        <ProjectActivityTimeline projectId={projectId} project={project} />
      </div>

      {/* Lightbox Modal for Evidence Photos */}
      {selectedEvidenceImg && (
        <div className="detail-lightbox-overlay" onClick={() => setSelectedEvidenceImg(null)}>
          <div className="detail-lightbox-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dlm-header">
              <div>
                <strong>{selectedEvidenceImg.name}</strong>
                <span className="dlm-cat">{selectedEvidenceImg.category}</span>
              </div>
              <button
                type="button"
                className="dlm-close"
                onClick={() => setSelectedEvidenceImg(null)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="dlm-body">
              <img src={selectedEvidenceImg.base64} alt={selectedEvidenceImg.name} />
            </div>
          </div>
        </div>
      )}

      {/* ===== ROLE-SPECIFIC ACTIONS ===== */}

      {/* Public Visitor Notice (when wallet is not connected) */}
      {!userAddress && (
        <div className="public-visitor-banner">
          <div className="pvb-content">
            <strong><Globe size={15} style={{ verticalAlign: 'middle', marginRight: 5 }} /> Viewing Public Project Record</strong>
            <p>Connect your MetaMask wallet as an authorized NGO, Validator, or Investor to participate in stewardship, verification voting, and token transactions.</p>
          </div>
          <Link to="/explore" className="bc-btn bc-btn--outline bc-btn--sm">
            ← Return to Explorer
          </Link>
        </div>
      )}

      {/* Validator / DAO Member: Vote Section (Step 4) */}
      {userAddress && (isValidator || isAdmin) && (
        <div className="voting-section">
          <h3>Step 4: Sentinel-2 ML Audit & DAO Consensus Vote</h3>
          {availableActions.canValidatorReview ? (
            <>
              <p className="vote-prompt">
                Audit the Sentinel-2 ML satellite ground-truth, detected canopy hectares, and ground evidence documents above, then cast your consensus vote:
              </p>
              <div className="vote-actions">
                <button onClick={() => handleVote('approve')} className="approve-btn" disabled={isVoting}>
                  {isVoting ? 'Processing...' : (
                    <>
                      <CheckCircle2 size={16} style={{ marginRight: 6 }} /> Approve Project (Passes ML & Evidence Criteria)
                    </>
                  )}
                </button>
                <button onClick={() => handleVote('disapprove')} className="disapprove-btn" disabled={isVoting}>
                  {isVoting ? 'Processing...' : (
                    <>
                      <XCircle size={16} style={{ marginRight: 6 }} /> Request Revision / Disapprove
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <p className="vote-message">
              Validator Consensus Status: <strong>{statusConfig.label}</strong> &mdash; {statusConfig.description}
            </p>
          )}
          {error && <p className="vote-error">{error}</p>}
        </div>
      )}

      {/* Admin: Mint Section */}
      {isAdmin && (
        <div className="admin-section">
          <h3>Admin Actions</h3>
          <AdminWalletInfo />

          {availableActions.canMintCredits ? (
            <div>
              <p>This project has received full DAO approval. Mint BCT tokens to the NGO's wallet:</p>
              <p className="mint-info">
                Recipient: <code>{project.walletAddress}</code><br />
                Amount: <strong>{(project.saplingsPlanted || 0).toLocaleString()} BCT</strong>
              </p>
              <button className="mint-btn" onClick={handleMintTokens} disabled={isMinting}>
                {isMinting ? 'Minting on-chain...' : 'Mint & Send Tokens to NGO'}
              </button>
            </div>
          ) : (
            <p>Current Status: <strong>{statusConfig.label}</strong>. Project must achieve full approval before tokens can be minted.</p>
          )}
          {txMessage && <p className="vote-message blockchain">{txMessage}</p>}
        </div>
      )}

      {/* NGO Owner: List for Sale */}
      {isNGO && isProjectOwner && isApproved && (
        <div className="ngo-action-section">
          <h3>List Tokens for Sale</h3>
          <p>Your project has been approved! You can now list your BCT tokens on the marketplace.</p>
          <Link to="/ngo/projects" className="list-tokens-link">
            Go to My Projects to List →
          </Link>
        </div>
      )}

      {/* Investor: Buy Link */}
      {isInvestor && project.price && project.price > 0 && (
        <div className="investor-action-section">
          <h3>Available on Marketplace</h3>
          <p>This project's tokens are listed at <strong>₹{Math.round(project.price < 100 ? project.price * 85 : project.price).toLocaleString('en-IN')} / credit (INR)</strong>.</p>
          <Link to="/marketplace" className="marketplace-link">
            Buy on Marketplace →
          </Link>
        </div>
      )}

      {/* AI Pre-Verification Report Modal */}
      <Modal
        isOpen={showAIReportModal}
        onClose={() => {
          setShowAIReportModal(false);
          setSelectedRunReport(null);
        }}
        title="AI Pre-Verification Audit Report"
        size="xl"
      >
        {(selectedRunReport || aiReport) && (
          <AIVerificationResult
            result={selectedRunReport || aiReport}
            allRuns={project.aiVerificationRuns || []}
            onSelectRun={(run) => setSelectedRunReport(run)}
            isValidator={isValidator}
            isNGO={isNGO}
          />
        )}
      </Modal>
    </div>
  );
};

export default ProjectDetail;
