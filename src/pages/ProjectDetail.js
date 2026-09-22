import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useWeb3 } from '../Web3Context';
import { useRole } from '../RoleContext';
import apiClient from '../services/api';
import SatelliteMLAudit from '../components/SatelliteMLAudit';
import MRVSummary from '../components/MRVSummary';
import ProjectLifecycle from '../components/ProjectLifecycle';
import ProjectActivityTimeline from '../components/ProjectActivityTimeline';
import { formatProjectId, normalizeStatus } from '../utils/projectStatus';
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
  Globe
} from 'lucide-react';
import './ProjectDetail.css';
import ProjectMintStatus from '../components/ProjectMintStatus';
import { getProjectJourney } from '../utils/projectJourney';
import '../components/Journey.css';

const ProjectDetail = () => {
  const { projectId } = useParams();
  const { isAdmin, userAddress, refreshBlockchain, blockchainConfig } = useWeb3();
  const { role, ROLES, setShowRoleSelector } = useRole();

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
  const [showSatellite, setShowSatellite] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);

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

  // Handle voting (off-chain validator review)
  useEffect(() => {
    if (!project?.blockchainTx || ['confirmed', 'reverted'].includes(project.blockchainState)) return;
    let cancelled = false;
    const check = async () => {
      try {
        const { data } = await apiClient.get('/blockchain/projects/' + projectId + '/receipt');
        if (!cancelled && data.confirmed) {
          setTxMessage('Demo tokens confirmed on Sepolia. No real-money gas was paid.');
          fetchProjectData();
          refreshBlockchain(userAddress);
        }
      } catch (err) {
        if (!cancelled) {
          setTxMessage(err.response?.data?.error || 'Unable to check confirmation. Retry shortly.');
          if (err.response?.status === 409) fetchProjectData();
        }
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [project?.blockchainTx, project?.blockchainState, projectId, fetchProjectData, refreshBlockchain, userAddress]);

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
      if (err.response?.status === 401) setNeedsLogin(true);
    } finally {
      setIsVoting(false);
    }
  };

  // Authenticated final approval triggers the backend relayer without a wallet signature.
  const handleMintTokens = async () => {
    if (!project) return;
    setIsMinting(true);
    try {
      if (project.blockchainTx) {
        const { data } = await apiClient.get('/blockchain/projects/' + projectId + '/receipt');
        setTxMessage(data.confirmed ? 'Confirmed on Sepolia.' : 'Still waiting for Sepolia confirmation.');
        fetchProjectData();
        await refreshBlockchain(userAddress);
        return;
      }
      setTxMessage('Approving and submitting through the Sepolia relayer. No wallet signature is needed.');
      const { data } = await apiClient.post('/blockchain/projects/' + projectId + '/approve', {}, { timeout: 60000 });
      setTxMessage(data.confirmed ? 'Demo tokens confirmed on Sepolia.' : 'Transaction recorded. Use Check confirmation after it is mined.');
      fetchProjectData();
      await refreshBlockchain(userAddress);
    } catch (err) {
      setTxMessage(err.response?.data?.error || err.message || 'Mint request failed.');
      if (err.response?.status === 401) setNeedsLogin(true);
      fetchProjectData();
    } finally { setIsMinting(false); }
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


  const normStatus = useMemo(() => normalizeStatus(project), [project]);
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

  const journey = getProjectJourney(project || {});
  const refreshReceipt = async () => {
    setIsMinting(true);
    try {
      const { data } = await apiClient.get('/blockchain/projects/' + projectId + '/receipt');
      setTxMessage(data.confirmed ? 'Tokens issued. Your project is complete.' : data.pending ? 'Waiting for network confirmation.' : 'No transaction recorded yet.');
      fetchProjectData(); await refreshBlockchain(userAddress);
    } catch (err) { setTxMessage(err.response?.data?.error || 'Unable to refresh. Please try again.'); }
    finally { setIsMinting(false); }
  };
  if (loading) return <div className="detail-loading"><p>Loading project…</p></div>;
  if (error && !project) return <div className="detail-error"><p>{error}</p></div>;
  if (!project) return <div className="detail-error"><p>Project not found.</p></div>;

  return (
    <div className="project-detail-container">
      {notification && <div className="realtime-notification">{notification}</div>}

      <Link to={isValidator ? "/verification" : isNGO ? "/ngo/projects" : "/dashboard"} className="back-link">
        ← Back to {isValidator ? "Review Queue" : isNGO ? "My Projects" : "Dashboard"}
      </Link>

      <div className="detail-header">
        <div>
          <span className="detail-proj-id">{formatProjectId(project._id || project.projectId || projectId)}</span>
          <h1>{project.projectName}</h1>
        </div>
        <div className="detail-badges-group">
          <span className={`detail-status-badge ${normStatus}`}>
            {journey.label}
          </span>
          <span className={`mrv-lifecycle-pill ${mrvStatus.color}`}>
            <Activity size={12} /> MRV: {mrvStatus.label}
          </span>
        </div>
      </div>
      <p className="detail-organization">Submitted by: {project.ngoId || project.ngoName || 'NGO Partner'}</p>
      <ProjectLifecycle project={project} compact />
      <section className="journey-next" aria-label="Next action">
        <h2>{journey.step === 3 ? 'Project complete' : 'What happens next'}</h2>
        <p>{journey.next}</p><p><strong>Who acts:</strong> {journey.owner}</p>
        <div className="journey-tools">
          {journey.action === 'check' && (isValidator || isProjectOwner) && <button className="journey-primary" onClick={handleRunAIPreVerification} disabled={isAnalyzingAI}>{isAnalyzingAI ? 'Running checks…' : 'Run project checks'}</button>}
          {journey.action === 'approve' && isValidator && <>
            <button className="journey-primary" onClick={handleMintTokens} disabled={isMinting || isVoting}>{isMinting ? 'Submitting…' : 'Approve & issue tokens'}</button>
            {!['approved', 'dao_approved'].includes(normStatus) && <button onClick={() => handleVote('disapprove')} disabled={isMinting || isVoting}>Request changes</button>}
          </>}
          {journey.action === 'edit' && isProjectOwner && <Link className="journey-primary" to={'/ngo/submit?projectId=' + projectId}>Update project</Link>}
          {journey.action === 'receipt' && <button onClick={refreshReceipt} disabled={isMinting}>Check transaction</button>}
          {journey.action === 'result' && <Link className="journey-primary" to="/token-registry">View issued tokens</Link>}
        </div>
        {journey.action === 'approve' && !isValidator && <p>A validator must sign in to complete this step. You can follow progress here.</p>}
        {(needsLogin || (journey.action === 'approve' && !isValidator)) && <button className="journey-primary" onClick={() => { setNeedsLogin(false); setShowRoleSelector(true); }}>Sign in as validator</button>}
        {isAnalyzingAI && <p role="status">{analyzingStepText || 'Checking project details and evidence…'}</p>}
        {error && <p role="alert">{error}</p>}
        {txMessage && <p role="status">{txMessage}</p>}
      </section>
      {(project.blockchainTx || journey.step >= 2) && <ProjectMintStatus project={project} config={blockchainConfig} canApprove={false}
        showActions={false} onRefresh={refreshReceipt} busy={isMinting} />}
      <details className="journey-details" open={journey.step === 1}>
        <summary>Checks & supporting evidence</summary>
        {aiReport ? <div><p><strong>Automated check: {aiReport.recommendationLabel || aiReport.recommendation}</strong></p>
          <Button onClick={() => { setSelectedRunReport(aiReport); setShowAIReportModal(true); }}>View check report</Button>
          {journey.action === 'edit' && isValidator && <Button onClick={handleRunAIPreVerification} loading={isAnalyzingAI}>Recheck evidence</Button>}
        </div> : <p>{journey.action === 'edit' ? 'No automated report is available for this record. Review the evidence and activity history for requested changes.' : 'No automated report yet. Run the project checks before validator review.'}</p>}
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
      <details className="journey-details" onToggle={e => setShowSatellite(e.currentTarget.open)}><summary>Satellite analysis (optional detail)</summary><div className="detail-location-zone">
        {showSatellite && (Number.isFinite(project.latitude ?? projectGeo?.latitude) && Number.isFinite(project.longitude ?? projectGeo?.longitude) && (project.areaHectares || project.baselineData?.projectArea) > 0 ? <SatelliteMLAudit
          latitude={project.latitude ?? projectGeo?.latitude}
          longitude={project.longitude ?? projectGeo?.longitude}
          claimedAreaHectares={project.areaHectares || project.baselineData?.projectArea}
          initialRadius={project.analysisRadius ? (project.analysisRadius > 50 ? project.analysisRadius / 1000 : project.analysisRadius) : 5.0}
          projectName={project.projectName}
          plantationType={project.plantationType}
        /> : <p>Add valid project coordinates and area before running satellite analysis.</p>)}
      </div>

      </details>
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

      </details>
      {/* Environmental Baseline & MRV Monitoring Section (Phase 8) */}
      <details className="journey-details"><summary>Environmental measurements & monitoring</summary><div className="detail-mrv-section">
        <MRVSummary
          baseline={baselineData}
          mrvRecords={mrvRecords}
          onAddMRVRecord={handleAddMRVRecord}
          canAddRecord={isValidator || isNGO || isAdmin}
          projectName={project.projectName}
        />
      </div>

      </details>
      {/* Project Verification Activity Timeline & Audit Log (Phase 9) */}
      <details className="journey-details"><summary>Activity history</summary><div className="detail-activity-section">
        <ProjectActivityTimeline projectId={projectId} project={project} />
      </div>

      </details>
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
            <p>You can follow this project without signing in. Connect your own wallet and choose a role to submit or review projects; no owner wallet is required.</p>
          </div>
          <Link to="/explore" className="bc-btn bc-btn--outline bc-btn--sm">
            ← Return to Explorer
          </Link>
        </div>
      )}

      {/* NGO Owner: List for Sale */}
      {isNGO && isProjectOwner && project.blockchainState === 'confirmed' && (
        <div className="ngo-action-section">
          <h3>Optional: try the marketplace demo</h3>
          <p>Your project is complete. Listing and purchases are separate demo features.</p>
          <Link to="/demo/project-listings" className="list-tokens-link">
            Open listing demo →
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
