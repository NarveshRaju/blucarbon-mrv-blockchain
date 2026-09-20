import React, { useState, useEffect, useMemo } from 'react';
import {
  BrainCircuit,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useRole } from '../RoleContext';
import { getProjects, updateProjectStatus } from '../services/projectService';
import { runAIVerification, getAIVerificationHistory } from '../services/aiVerificationService';
import { formatProjectId } from '../utils/projectStatus';
import { StatCard, Button, Modal, EmptyState } from '../components/ui';
import AIVerificationResult from '../components/AIVerificationResult';
import './AIVerification.css';

const AI_STEPS = [
  'Cross-referencing database for duplicate projects and analysis zone buffer overlap...',
  'Checking latitudinal biophysical bounds & land authorization documents...',
  'Computing cryptographic SHA-256 evidence integrity & cross-project file reuse...',
  'Evaluating Sentinel-2 optical spectral calculations (NDVI / EVI)...',
  'Screening biophysical growth ceilings & silvicultural tree density...',
  'Executing allometric biomass modeling & carbon accounting calculations...'
];

const AIVerification = () => {
  const { role, ROLES } = useRole();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Active project being inspected or analyzed
  const [selectedProject, setSelectedProject] = useState(null);
  const [aiReport, setAiReport] = useState(null);
  const [projectRuns, setProjectRuns] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);

  // Animated analysis loading state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStepIndex, setAnalysisStepIndex] = useState(0);

  const isAuthorized = role === ROLES.VALIDATOR || role === ROLES.ADMIN;

  const loadProjectsData = async () => {
    setLoading(true);
    try {
      const data = await getProjects();
      setProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load projects for AI verification queue:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjectsData();
  }, []);

  // Filter projects for AI Verification queue
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const pid = formatProjectId(p.projectId || p._id || p.id).toLowerCase();
      const pname = (p.projectName || p.name || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || pid.includes(q) || pname.includes(q);

      const ai = p.aiVerification;
      const rec = ai && ai.status && ai.status !== 'ai_pending' ? ai.recommendation : 'PENDING';

      if (statusFilter === 'all') return matchesSearch;
      if (statusFilter === 'pending') return matchesSearch && rec === 'PENDING';
      if (statusFilter === 'pass') return matchesSearch && rec === 'PASS';
      if (statusFilter === 'flagged') return matchesSearch && rec === 'FLAGGED';
      if (statusFilter === 'fail') return matchesSearch && rec === 'FAIL';

      return matchesSearch;
    });
  }, [projects, searchQuery, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    let pendingCount = 0;
    let passCount = 0;
    let flaggedCount = 0;
    let failCount = 0;

    projects.forEach((p) => {
      const ai = p.aiVerification;
      if (!ai || !ai.status || ai.status === 'ai_pending') {
        pendingCount++;
      } else if (ai.recommendation === 'PASS') {
        passCount++;
      } else if (ai.recommendation === 'FLAGGED') {
        flaggedCount++;
      } else if (ai.recommendation === 'FAIL') {
        failCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      total: projects.length,
      pending: pendingCount,
      pass: passCount,
      flagged: flaggedCount,
      fail: failCount,
    };
  }, [projects]);

  // Trigger AI Pre-Verification with step loading animation and backend MongoDB persistence
  const handleRunAIVerification = async (project) => {
    setSelectedProject(project);
    setIsAnalyzing(true);
    setAnalysisStepIndex(0);

    const pid = project.projectId || project._id || project.id;

    // Step-by-step progress animation
    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < AI_STEPS.length - 1) {
        setAnalysisStepIndex(step);
      }
    }, 400);

    try {
      // Execute backend AI verification on real MongoDB project
      const report = await runAIVerification(pid);
      clearInterval(interval);
      setAnalysisStepIndex(AI_STEPS.length - 1);
      setAiReport(report);

      const history = await getAIVerificationHistory(pid);
      setProjectRuns(history);

      setShowReportModal(true);
      await loadProjectsData(); // refresh project list from MongoDB
    } catch (err) {
      clearInterval(interval);
      console.error('AI verification failed on backend:', err);
      alert('Failed to execute AI verification pipeline. Please check backend connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Inspect existing report
  const handleInspectReport = async (project) => {
    const pid = project.projectId || project._id || project.id;
    const report = (project.aiVerification && project.aiVerification.status !== 'ai_pending')
      ? project.aiVerification
      : null;

    setSelectedProject(project);

    if (report) {
      setAiReport(report);
      try {
        const history = await getAIVerificationHistory(pid);
        setProjectRuns(history);
      } catch {
        setProjectRuns(project.aiVerificationRuns || []);
      }
      setShowReportModal(true);
    } else {
      // If not yet run, trigger verification
      await handleRunAIVerification(project);
    }
  };

  // Validator action: approve project for DAO Review
  const handleApproveForDAO = async () => {
    if (!selectedProject) return;
    const pid = selectedProject.projectId || selectedProject._id || selectedProject.id;
    try {
      await updateProjectStatus(pid, 'dao_review');
      setShowReportModal(false);
      loadProjectsData();
    } catch (err) {
      console.error('Failed to advance project to DAO review:', err);
    }
  };

  // Validator action: request NGO revision
  const handleRequestRevision = async () => {
    if (!selectedProject) return;
    const pid = selectedProject.projectId || selectedProject._id || selectedProject.id;
    try {
      await updateProjectStatus(pid, 'validator_rejected');
      setShowReportModal(false);
      loadProjectsData();
    } catch (err) {
      console.error('Failed to request revision:', err);
    }
  };

  return (
    <div className="ai-verification-page">
      {/* Page Header */}
      <div className="ai-v-header">
        <div className="ai-v-header-title">
          <BrainCircuit size={26} className="text-primary" />
          <div>
            <h1>AI Pre-Verification Screening</h1>
            <p>Automated authenticity, geographic boundary, satellite, and biophysical screening.</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          icon={<RefreshCw size={14} />}
          onClick={loadProjectsData}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="ai-v-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
        <StatCard
          title="Total Submissions"
          value={stats.total}
          icon={<Layers size={18} />}
          variant="default"
        />
        <StatCard
          title="Pending Analysis"
          value={stats.pending}
          icon={<Clock size={18} />}
          variant="warning"
        />
        <StatCard
          title="Eligible (Passed)"
          value={stats.pass}
          icon={<CheckCircle2 size={18} />}
          variant="success"
        />
        <StatCard
          title="Flagged for Review"
          value={stats.flagged + stats.fail}
          icon={<AlertTriangle size={18} />}
          variant="danger"
        />
      </div>

      {/* Queue Controls */}
      <div className="ai-v-controls">
        <div className="ai-v-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by Project ID or Name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="ai-v-filters">
          <span className="filter-label">Filter:</span>
          {['all', 'pending', 'pass', 'flagged', 'fail'].map((f) => (
            <button
              key={f}
              type="button"
              className={`filter-btn ${statusFilter === f ? 'active' : ''}`}
              onClick={() => setStatusFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'pass' ? 'Pass' : f === 'flagged' ? 'Flagged' : f === 'fail' ? 'Fail' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table / Queue */}
      <div className="ai-v-table-card">
        {loading ? (
          <div className="ai-v-loading">
            <BrainCircuit size={32} className="text-primary spin-animation" />
            <p>Loading projects from MongoDB registry...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <EmptyState
            icon={<BrainCircuit size={48} />}
            title="No projects match this filter"
            description="All project submissions have been evaluated or no matching projects found in the queue."
          />
        ) : (
          <div className="table-responsive">
            <table className="ai-v-table">
              <thead>
                <tr>
                  <th>Project ID</th>
                  <th>Project Name</th>
                  <th>NGO Steward</th>
                  <th>Ecosystem & Trees</th>
                  <th>Evidence Check</th>
                  <th>AI Recommendation</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const pid = project.projectId || project._id || project.id;
                  const formattedId = formatProjectId(pid);
                  const aiRes = project.aiVerification && project.aiVerification.status !== 'ai_pending'
                    ? project.aiVerification
                    : null;
                  const evidenceCount = (project.imageBase64s?.length || 0) + (project.evidence?.length || 0);

                  return (
                    <tr key={pid} className="ai-v-row">
                      <td className="font-mono text-sm font-bold">{formattedId}</td>
                      <td>
                        <div className="proj-name-cell">
                          <strong>{project.projectName || project.name}</strong>
                          <span className="proj-location-sub">{project.location || 'Coordinates Recorded'}</span>
                        </div>
                      </td>
                      <td>
                        <span className="ngo-tag">{project.ngoId || 'Verified NGO'}</span>
                      </td>
                      <td>
                        <div className="trees-cell">
                          <span>{project.plantationType || 'Mangrove'}</span>
                          <small className="text-muted">
                            {(project.saplingsPlanted || 0).toLocaleString()} trees &bull; {project.areaHectares || 1} ha
                          </small>
                        </div>
                      </td>
                      <td>
                        <span className={`evidence-badge ${evidenceCount > 0 ? 'has' : 'none'}`}>
                          {evidenceCount > 0 ? `${evidenceCount} files recorded` : 'No files attached'}
                        </span>
                      </td>
                      <td>
                        {aiRes ? (
                          <div className="ai-rec-cell">
                            <span
                              className="rec-pill"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                padding: '3px 8px',
                                borderRadius: 6,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                background: aiRes.recommendation === 'PASS' ? '#dcfce7' : aiRes.recommendation === 'FLAGGED' ? '#fef3c7' : '#fee2e2',
                                color: aiRes.recommendation === 'PASS' ? '#15803d' : aiRes.recommendation === 'FLAGGED' ? '#b45309' : '#b91c1c'
                              }}
                            >
                              {aiRes.recommendation === 'PASS' && <CheckCircle2 size={12} />}
                              {aiRes.recommendation === 'FLAGGED' && <AlertTriangle size={12} />}
                              {aiRes.recommendation === 'FAIL' && <XCircle size={12} />}
                              {aiRes.recommendation}
                            </span>
                            {aiRes.runNumber && (
                              <small className="text-muted" style={{ display: 'block', marginTop: 2, fontSize: '0.7rem' }}>
                                Run #{aiRes.runNumber}
                              </small>
                            )}
                          </div>
                        ) : (
                          <span className="rec-pill pending" style={{ background: '#f1f5f9', color: '#475569', padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600 }}>
                            <Clock size={12} style={{ display: 'inline', marginRight: 4 }} />
                            Awaiting Pre-Screening
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="actions-cell">
                          {aiRes ? (
                            <Button
                              size="xs"
                              variant="secondary"
                              onClick={() => handleInspectReport(project)}
                            >
                              Inspect Audit Report
                            </Button>
                          ) : (
                            <Button
                              size="xs"
                              variant="primary"
                              icon={<BrainCircuit size={12} />}
                              onClick={() => handleRunAIVerification(project)}
                              disabled={isAnalyzing}
                            >
                              Run Pre-Verification
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Analysis Running Progress Modal */}
      {isAnalyzing && (
        <div className="analysis-overlay">
          <div className="analysis-card">
            <BrainCircuit size={48} className="text-primary spin-animation" />
            <h3>Automated Pre-Verification Pipeline Running</h3>
            <p className="analysis-sub">Evaluating authenticity, geographic collisions, SHA-256 hashes, and biophysical bounds...</p>

            <div className="step-progress-bar-wrap">
              <div
                className="step-progress-fill"
                style={{ width: `${((analysisStepIndex + 1) / AI_STEPS.length) * 100}%` }}
              />
            </div>

            <div className="active-step-badge">
              <span className="step-num">Step {analysisStepIndex + 1}/{AI_STEPS.length}:</span>
              <span>{AI_STEPS[analysisStepIndex]}</span>
            </div>
          </div>
        </div>
      )}

      {/* Structured Report Modal */}
      <Modal
        isOpen={showReportModal}
        onClose={() => {
          setShowReportModal(false);
          setSelectedProject(null);
          setAiReport(null);
          setProjectRuns([]);
        }}
        title={`AI Pre-Verification Audit Report — ${selectedProject?.projectName || 'Project'}`}
        size="xl"
      >
        {aiReport && (
          <AIVerificationResult
            result={aiReport}
            allRuns={projectRuns.length > 0 ? projectRuns : (selectedProject?.aiVerificationRuns || [])}
            onSelectRun={(run) => setAiReport(run)}
            isValidator={isAuthorized}
            isNGO={role === ROLES.NGO}
            onApproveForDAO={handleApproveForDAO}
            onRequestRevision={handleRequestRevision}
          />
        )}
      </Modal>
    </div>
  );
};

export default AIVerification;
