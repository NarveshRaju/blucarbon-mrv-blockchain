import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Layers,
  MapPin,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Satellite,
  Scale,
  Sparkles,
  Flame,
  Info,
  History,
  Building2,
  AlertCircle
} from 'lucide-react';
import { Button } from './ui';
import './AIVerificationResult.css';

/**
 * AIVerificationResult Component (Phase 11 Real Copernicus & Gemini Engine)
 *
 * Renders the authoritative 5-dimension AI Pre-Verification report.
 * Strictly adheres to real data, real Sentinel-2 formulas, SHA-256 evidence hashes,
 * biophysical bounds, and legal honesty.
 */
const AIVerificationResult = ({
  result,
  allRuns = [],
  onSelectRun,
  onApproveForDAO,
  onRequestRevision,
  isValidator = false,
  isNGO = false,
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'actions' | 'findings' | 'carbon'
  const [expandedSection, setExpandedSection] = useState(null);

  if (!result) return null;

  const {
    verificationId,
    projectId,
    engineVersion = '3.0.0-real-copernicus-gemini-engine',
    status = 'PASSED_FOR_HUMAN_REVIEW',
    overallRecommendation = 'PASSED_FOR_HUMAN_REVIEW',
    recommendationLabel = 'PASSED FOR HUMAN VALIDATOR REVIEW',
    recommendationMessage = '',
    landAuthorization = {},
    documentAnalysis = [],
    ngoConsistency = {},
    locationConsistency = {},
    authenticityOverlap = {},
    satelliteAnalysis = {},
    vegetationPlausibility = {},
    evidenceCrypto = {},
    actionRequired = [],
    riskFlags = [],
    limitations = []
  } = result;

  const toggleSection = (sectionKey) => {
    setExpandedSection(expandedSection === sectionKey ? null : sectionKey);
  };

  const handleFixStep = (stepNumber = 5) => {
    if (!projectId) return;
    navigate(`/ngo/submit?projectId=${projectId}&step=${stepNumber}`);
  };

  const getStatusBadge = (secStatus) => {
    switch (secStatus) {
      case 'SUPPORTED':
      case 'PASS':
      case 'SUCCESS':
        return <span className="ai-status-pill pass"><CheckCircle2 size={13} /> SUPPORTED</span>;
      case 'PARTIALLY_SUPPORTED':
      case 'FLAGGED':
        return <span className="ai-status-pill flagged"><AlertTriangle size={13} /> PARTIAL</span>;
      case 'POTENTIAL_INCONSISTENCY':
      case 'FAIL':
        return <span className="ai-status-pill fail"><XCircle size={13} /> INCONSISTENCY</span>;
      case 'INSUFFICIENT_EVIDENCE':
        return <span className="ai-status-pill flagged"><AlertCircle size={13} /> INSUFFICIENT</span>;
      case 'UNAVAILABLE':
      case 'DATA_UNAVAILABLE':
        return <span className="ai-status-pill unavailable"><Info size={13} /> UNAVAILABLE</span>;
      default:
        return <span className="ai-status-pill review">{secStatus || 'EVALUATED'}</span>;
    }
  };

  const isPass = status === 'PASSED_FOR_HUMAN_REVIEW' || overallRecommendation === 'PASSED_FOR_HUMAN_REVIEW';
  const isNeedsInfo = status === 'NEEDS_INFORMATION' || overallRecommendation === 'NEEDS_INFORMATION';
  const isFlagged = status === 'FLAGGED_FOR_MANUAL_REVIEW' || overallRecommendation === 'FLAGGED_FOR_MANUAL_REVIEW';

  const recBannerClass = isPass
    ? 'rec-banner--pass'
    : isNeedsInfo
    ? 'rec-banner--flagged'
    : 'rec-banner--fail';

  return (
    <div className="ai-real-report-container">
      {/* 1. Top Bar & Metadata */}
      <div className="ai-report-top-bar">
        <div className="ai-report-header-info">
          <div className="ai-title-row">
            <BrainCircuit className="ai-header-icon" size={24} />
            <div>
              <h3>AI Pre-Verification Screening Report</h3>
              <p className="ai-meta-subtitle">
                Engine: <code>{engineVersion}</code> &bull; ID: <code>{verificationId}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Multi-Run Selector */}
        {allRuns && allRuns.length > 1 && (
          <div className="ai-run-selector-group">
            <span className="run-sel-label"><History size={13} /> Verification Runs:</span>
            <div className="run-pills">
              {allRuns.map((run, idx) => (
                <button
                  key={run.verificationId || idx}
                  type="button"
                  className={`run-pill-btn ${run.verificationId === verificationId ? 'active' : ''}`}
                  onClick={() => onSelectRun && onSelectRun(run)}
                >
                  Run #{run.runNumber || idx + 1}
                  <span className={`mini-dot ${(run.status || run.overallRecommendation || 'pass').toLowerCase().includes('pass') ? 'pass' : (run.status || run.overallRecommendation || '').includes('needs') ? 'flagged' : 'fail'}`} />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Overall AI Recommendation Banner */}
      <div className={`ai-recommendation-banner ${recBannerClass}`}>
        <div className="rec-banner-content">
          <div className="rec-icon-wrap">
            {isPass && <CheckCircle2 size={26} />}
            {isNeedsInfo && <AlertCircle size={26} />}
            {isFlagged && <ShieldAlert size={26} />}
          </div>
          <div>
            <div className="rec-title-line">
              <h4>{recommendationLabel}</h4>
              <span className="rec-badge">{overallRecommendation || status}</span>
            </div>
            <p className="rec-desc">{recommendationMessage}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="rec-banner-actions">
          {isNGO && (isNeedsInfo || isFlagged) && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={() => handleFixStep(actionRequired[0]?.targetStep || 5)}
            >
              Resolve Action Items
            </Button>
          )}

          {isValidator && onApproveForDAO && isPass && (
            <Button
              type="button"
              variant="primary"
              size="sm"
              icon={<CheckCircle2 size={14} />}
              onClick={onApproveForDAO}
            >
              Approve for DAO Consensus
            </Button>
          )}

          {isValidator && onRequestRevision && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              icon={<XCircle size={14} />}
              onClick={onRequestRevision}
            >
              Request Revision
            </Button>
          )}
        </div>
      </div>

      {/* 3. Action Required Warning Box (if NEEDS_INFORMATION) */}
      {actionRequired.length > 0 && (
        <div className="ai-action-required-card">
          <div className="aarc-header">
            <AlertCircle size={18} />
            <h5>Action Required by NGO Steward ({actionRequired.length})</h5>
          </div>
          <div className="aarc-list">
            {actionRequired.map((act, idx) => (
              <div key={idx} className="aarc-item">
                <div className="aarc-text">
                  <strong>{act.issueTitle}</strong>
                  <p className="aarc-why"><strong>Why it matters:</strong> {act.whyItMatters}</p>
                  <p className="aarc-req"><strong>Required action:</strong> {act.requiredAction}</p>
                </div>
                {isNGO && (
                  <Button
                    size="xs"
                    variant="primary"
                    onClick={() => handleFixStep(act.targetStep || 5)}
                  >
                    Fix in Wizard Step {act.targetStep || 5} →
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Tab Navigation */}
      <div className="ai-report-tabs">
        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
          onClick={() => setActiveTab('modules')}
        >
          <Layers size={14} /> Investigation Dimensions (5)
        </button>
        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'satellite' ? 'active' : ''}`}
          onClick={() => setActiveTab('satellite')}
        >
          <Satellite size={14} /> Copernicus Satellite Analysis
        </button>
        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'carbon' ? 'active' : ''}`}
          onClick={() => setActiveTab('carbon')}
        >
          <Flame size={14} /> Biomass & Carbon Accounting
        </button>
        <button
          type="button"
          className={`ai-tab-btn ${activeTab === 'limitations' ? 'active' : ''}`}
          onClick={() => setActiveTab('limitations')}
        >
          <Scale size={14} /> Legal & Scientific Limitations
        </button>
      </div>

      {/* 5. Tab 1: 5 Investigation Dimensions */}
      {activeTab === 'modules' && (
        <div className="ai-modules-accordion">
          {/* Dimension 1: Land & Authorization Evidence */}
          <div className="ai-module-card">
            <div className="ai-module-card-header" onClick={() => toggleSection('land')}>
              <div className="amc-title-group">
                <span className="amc-icon"><Scale size={18} /></span>
                <div>
                  <h5>1. Land & Authorization Evidence</h5>
                  <span className="amc-sub">
                    {documentAnalysis.length} evidence file(s) evaluated with Gemini AI & OCR
                  </span>
                </div>
              </div>
              <div className="amc-right">
                {getStatusBadge(landAuthorization.status)}
                <span className="amc-chevron">{expandedSection === 'land' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </div>
            </div>

            {expandedSection === 'land' && (
              <div className="ai-module-expanded-body">
                <div className="ai-legal-notice-box">
                  <Scale size={16} className="legal-icon" />
                  <div>
                    <strong>Legal Land Ownership Notice:</strong>
                    <p>{landAuthorization.legalDisclaimer}</p>
                  </div>
                </div>

                {documentAnalysis.length > 0 ? (
                  <div className="gemini-docs-list">
                    <h6>Gemini Semantic Document Findings:</h6>
                    {documentAnalysis.map((doc, idx) => (
                      <div key={idx} className="doc-analysis-item">
                        <div className="dai-head">
                          <strong>{doc.fileName}</strong>
                          <span className="cat-pill">{doc.documentType || doc.category}</span>
                        </div>
                        <p className="dai-auth"><strong>Authorization Summary:</strong> {doc.authorizationEvidence || 'No explicit stewardship text found.'}</p>
                        {doc.organizationName && <p className="dai-sub"><strong>Document Org:</strong> {doc.organizationName}</p>}
                        {doc.locationReferences?.length > 0 && (
                          <p className="dai-sub"><strong>Extracted Locations:</strong> {doc.locationReferences.join(', ')}</p>
                        )}
                        {doc.riskFlags?.length > 0 && (
                          <div className="findings-sub-block warning" style={{ marginTop: '0.5rem' }}>
                            <ul>
                              {doc.riskFlags.map((rf, rIdx) => <li key={rIdx}><AlertTriangle size={13} /> {rf}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No structured evidence documents uploaded.</p>
                )}
              </div>
            )}
          </div>

          {/* Dimension 2: NGO Document Consistency */}
          <div className="ai-module-card">
            <div className="ai-module-card-header" onClick={() => toggleSection('ngo')}>
              <div className="amc-title-group">
                <span className="amc-icon"><Building2 size={18} /></span>
                <div>
                  <h5>2. NGO Profile & Identity Consistency</h5>
                  <span className="amc-sub">Cross-reference between profile NGO ID and document entities</span>
                </div>
              </div>
              <div className="amc-right">
                {getStatusBadge(ngoConsistency.status)}
                <span className="amc-chevron">{expandedSection === 'ngo' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </div>
            </div>

            {expandedSection === 'ngo' && (
              <div className="ai-module-expanded-body">
                {ngoConsistency.findings?.length > 0 && (
                  <div className="findings-sub-block pass">
                    <ul>
                      {ngoConsistency.findings.map((f, idx) => <li key={idx}><CheckCircle2 size={13} /> {f}</li>)}
                    </ul>
                  </div>
                )}
                {ngoConsistency.warnings?.length > 0 && (
                  <div className="findings-sub-block warning">
                    <ul>
                      {ngoConsistency.warnings.map((w, idx) => <li key={idx}><AlertTriangle size={13} /> {w}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dimension 3: Geographic Location Consistency */}
          <div className="ai-module-card">
            <div className="ai-module-card-header" onClick={() => toggleSection('location')}>
              <div className="amc-title-group">
                <span className="amc-icon"><MapPin size={18} /></span>
                <div>
                  <h5>3. Geographic & Location Consistency</h5>
                  <span className="amc-sub">GPS coordinates, document place names, and circular buffer overlap</span>
                </div>
              </div>
              <div className="amc-right">
                {getStatusBadge(locationConsistency.status)}
                <span className="amc-chevron">{expandedSection === 'location' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </div>
            </div>

            {expandedSection === 'location' && (
              <div className="ai-module-expanded-body">
                <div className="loc-meta-box" style={{ fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span>Submitted Location: <strong>{locationConsistency.submittedLocation}</strong></span>
                  {locationConsistency.submittedCoordinates && (
                    <span>Coordinates: Lat <code>{locationConsistency.submittedCoordinates.latitude}</code>, Lon <code>{locationConsistency.submittedCoordinates.longitude}</code></span>
                  )}
                </div>

                {/* Cross-Project Overlaps */}
                {authenticityOverlap.details?.detectedOverlaps?.length > 0 && (
                  <div className="ai-overlaps-table-wrap" style={{ marginTop: '0.75rem' }}>
                    <h6>Spatial Collisions with Existing Projects:</h6>
                    <table className="ai-hashes-table">
                      <thead>
                        <tr>
                          <th>Conflicting Project</th>
                          <th>Distance</th>
                          <th>Zone Overlap %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {authenticityOverlap.details.detectedOverlaps.map((ov, idx) => (
                          <tr key={idx}>
                            <td><strong>{ov.projectName}</strong></td>
                            <td>{ov.distanceMeters.toLocaleString()} m</td>
                            <td><strong style={{ color: '#c5221f' }}>{ov.overlapPercentage}%</strong></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {locationConsistency.findings?.length > 0 && (
                  <div className="findings-sub-block pass" style={{ marginTop: '0.75rem' }}>
                    <ul>
                      {locationConsistency.findings.map((f, idx) => <li key={idx}><CheckCircle2 size={13} /> {f}</li>)}
                    </ul>
                  </div>
                )}
                {locationConsistency.riskFlags?.length > 0 && (
                  <div className="findings-sub-block warning" style={{ marginTop: '0.5rem' }}>
                    <ul>
                      {locationConsistency.riskFlags.map((rf, idx) => <li key={idx}><AlertTriangle size={13} /> {rf}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Dimension 4: Cryptographic Evidence Hashes */}
          <div className="ai-module-card">
            <div className="ai-module-card-header" onClick={() => toggleSection('crypto')}>
              <div className="amc-title-group">
                <span className="amc-icon"><FileText size={18} /></span>
                <div>
                  <h5>4. Evidence Authenticity & SHA-256 Integrity</h5>
                  <span className="amc-sub">Cryptographic hash verification and cross-project duplicate detection</span>
                </div>
              </div>
              <div className="amc-right">
                {getStatusBadge(evidenceCrypto.status || 'SUPPORTED')}
                <span className="amc-chevron">{expandedSection === 'crypto' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </div>
            </div>

            {expandedSection === 'crypto' && (
              <div className="ai-module-expanded-body">
                {evidenceCrypto.details?.evidenceRecords?.length > 0 ? (
                  <div className="ai-hashes-table-wrap">
                    <table className="ai-hashes-table">
                      <thead>
                        <tr>
                          <th>File Name</th>
                          <th>Category</th>
                          <th>SHA-256 Checksum</th>
                          <th>Reuse Check</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evidenceCrypto.details.evidenceRecords.map((rec) => (
                          <tr key={rec.id}>
                            <td>{rec.fileName}</td>
                            <td><span className="cat-pill">{rec.category}</span></td>
                            <td><code>{rec.sha256?.slice(0, 16)}...{rec.sha256?.slice(-8)}</code></td>
                            <td>
                              {rec.reusedFromOtherProject ? (
                                <span className="reuse-flag danger">Duplicate in {rec.reusedDetails?.projectName}</span>
                              ) : (
                                <span className="reuse-flag safe">Unique</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.85rem' }}>No evidence records uploaded.</p>
                )}
              </div>
            )}
          </div>

          {/* Dimension 5: Biophysical Growth & Anomaly Detection */}
          <div className="ai-module-card">
            <div className="ai-module-card-header" onClick={() => toggleSection('bio')}>
              <div className="amc-title-group">
                <span className="amc-icon"><Activity size={18} /></span>
                <div>
                  <h5>5. Mangrove Growth Plausibility & Anomaly Detection</h5>
                  <span className="amc-sub">Biophysical growth ceilings (25 t/ha/yr) and silvicultural density</span>
                </div>
              </div>
              <div className="amc-right">
                {getStatusBadge(vegetationPlausibility.anomalyReport?.status || 'SUPPORTED')}
                <span className="amc-chevron">{expandedSection === 'bio' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
              </div>
            </div>

            {expandedSection === 'bio' && (
              <div className="ai-module-expanded-body">
                {vegetationPlausibility.anomalyReport?.findings?.length > 0 && (
                  <div className="findings-sub-block pass">
                    <ul>
                      {vegetationPlausibility.anomalyReport.findings.map((f, idx) => <li key={idx}><CheckCircle2 size={13} /> {f}</li>)}
                    </ul>
                  </div>
                )}
                {vegetationPlausibility.anomalyReport?.criticalIssues?.length > 0 && (
                  <div className="findings-sub-block critical" style={{ marginTop: '0.5rem' }}>
                    <ul>
                      {vegetationPlausibility.anomalyReport.criticalIssues.map((ci, idx) => <li key={idx}><XCircle size={13} /> {ci}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Tab 2: Copernicus Satellite Environmental Analysis */}
      {activeTab === 'satellite' && (
        <div className="ai-satellite-tab-view">
          <div className="ai-spectral-details-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h6 style={{ margin: 0 }}>Copernicus Sentinel-2 Level-2A Spectral Index Engine</h6>
              {getStatusBadge(satelliteAnalysis.status)}
            </div>

            {satelliteAnalysis.status === 'SUPPORTED' ? (
              <>
                <div className="spectral-formulas-grid">
                  <div className="formula-card">
                    <strong>Normalized Difference Vegetation Index (NDVI)</strong>
                    <code>NDVI = (Band 8 [NIR] - Band 4 [RED]) / (Band 8 [NIR] + Band 4 [RED])</code>
                    <div className="val-row">
                      <span>Calculated Value:</span>
                      <strong style={{ color: '#15803d', fontSize: '1rem' }}>{satelliteAnalysis.ndvi}</strong>
                    </div>
                    <span className="cat-pill" style={{ marginTop: 4, width: 'fit-content' }}>{satelliteAnalysis.vegetationCategory}</span>
                  </div>

                  <div className="formula-card">
                    <strong>Enhanced Vegetation Index (EVI)</strong>
                    <code>EVI = 2.5 * (NIR - RED) / (NIR + 6*RED - 7.5*BLUE + 1)</code>
                    <div className="val-row">
                      <span>Calculated Value:</span>
                      <strong style={{ color: '#0369a1', fontSize: '1rem' }}>{satelliteAnalysis.evi !== null ? satelliteAnalysis.evi : 'N/A'}</strong>
                    </div>
                  </div>
                </div>

                <div className="sat-obs-meta" style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>Sensor Source: <strong>{satelliteAnalysis.satelliteSource}</strong></span>
                  <span>Observation Date: <strong>{satelliteAnalysis.observationDates?.[0] ? new Date(satelliteAnalysis.observationDates[0]).toLocaleDateString() : 'Recent'}</strong></span>
                  <span>Scene Cloud Cover: <strong>{satelliteAnalysis.cloudCoverage}</strong></span>
                  {satelliteAnalysis.boundingBox && (
                    <span>Bounding Box: <code>[{satelliteAnalysis.boundingBox.join(', ')}]</code></span>
                  )}
                </div>
              </>
            ) : (
              <div className="sat-unavailable-box" style={{ padding: '1rem', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  <strong>Satellite Data Status:</strong> {satelliteAnalysis.errorDetails || 'Copernicus satellite query could not be completed.'}
                </p>
                <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#475569' }}>
                  <span>Formulas configured for automatic computation:</span>
                  <div style={{ marginTop: 4 }}>
                    <code>NDVI = (B08 - B04) / (B08 + B04)</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Tab 3: Biomass & Carbon Stock Accounting */}
      {activeTab === 'carbon' && (
        <div className="ai-carbon-tab-view">
          <div className="carbon-grid-top">
            <div className="carbon-stat-card">
              <span className="csc-label">Vegetation Carbon Density</span>
              <strong className="csc-value">
                {vegetationPlausibility.carbonAccounting?.outputs?.vegetationCarbonDensityTonnesPerHa !== undefined
                  ? `${vegetationPlausibility.carbonAccounting.outputs.vegetationCarbonDensityTonnesPerHa} tC/ha`
                  : 'Pending'}
              </strong>
              <span className="csc-sub">Biomass (t/ha) &times; 0.47 (IPCC)</span>
            </div>

            <div className="carbon-stat-card">
              <span className="csc-label">Total Project Carbon Stock</span>
              <strong className="csc-value">
                {vegetationPlausibility.carbonAccounting?.outputs?.totalProjectCarbonTonnes !== undefined
                  ? `${vegetationPlausibility.carbonAccounting.outputs.totalProjectCarbonTonnes} tC`
                  : 'Pending'}
              </strong>
              <span className="csc-sub">Total aboveground & soil carbon</span>
            </div>

            <div className="carbon-stat-card highlight">
              <span className="csc-label">Equivalent CO2 Sequestration</span>
              <strong className="csc-value">
                {vegetationPlausibility.carbonAccounting?.outputs?.totalCO2eTonnes !== undefined
                  ? `${vegetationPlausibility.carbonAccounting.outputs.totalCO2eTonnes.toLocaleString()} tCO2e`
                  : 'Pending'}
              </strong>
              <span className="csc-sub">Total Carbon &times; (44 / 12)</span>
            </div>
          </div>

          <div className="carbon-audit-trail-box" style={{ marginTop: '1rem' }}>
            <h5>Mathematical Model Audit Trail</h5>
            <div className="catb-equations">
              <div className="eq-item">
                <span className="eq-name">Allometric Model:</span>
                <code>Komiyama et al. (2008): AGB (kg/tree) = 0.251 * rho * (DBH ^ 2.46)</code>
              </div>
              <div className="eq-item">
                <span className="eq-name">Carbon Conversion:</span>
                <code>Carbon (tC/ha) = Biomass * 0.47</code>
              </div>
              <div className="eq-item">
                <span className="eq-name">CO2 Equivalent:</span>
                <code>CO2e (tCO2e) = Total Carbon (tC) * (44 / 12)</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Tab 4: Legal & Scientific Limitations */}
      {activeTab === 'limitations' && (
        <div className="ai-limitations-tab-view" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div className="ai-legal-notice-box">
            <Scale size={20} className="legal-icon" />
            <div>
              <strong>Scientific & Legal Governance Framework</strong>
              <p>
                The BlueChain AI Pre-Verification engine operates strictly as an automated pre-screening layer.
                It produces evidence findings, biophysical audits, and risk flags to assist accredited human validators.
              </p>
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.85rem' }}>
            <h6 style={{ margin: '0 0 0.5rem 0', fontWeight: 700 }}>Mandatory Disclaimers:</h6>
            <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', lineHeight: 1.5 }}>
              {limitations.map((lim, idx) => (
                <li key={idx}>{lim}</li>
              ))}
            </ul>
          </div>

          {riskFlags.length > 0 && (
            <div style={{ background: '#fffbeb', padding: '1rem', borderRadius: 8, border: '1px solid #fde68a', fontSize: '0.85rem' }}>
              <h6 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: '#92400e' }}>Active Risk Flags ({riskFlags.length}):</h6>
              <ul style={{ margin: 0, paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', color: '#92400e' }}>
                {riskFlags.map((rf, idx) => (
                  <li key={idx}>{rf}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIVerificationResult;
