import React, { useState } from 'react';
import {
  Activity,
  TreePine,
  TrendingUp,
  Satellite,
  Calendar,
  Layers,
  ShieldCheck,
  PlusCircle,
  FileText,
  Info,
  Clock
} from 'lucide-react';
import { StatCard, EmptyState, Modal, Button } from './ui';
import MRVDataForm from './MRVDataForm';
import './MRVSummary.css';

/**
 * MRVSummary component for displaying baseline environmental metrics,
 * latest remote sensing observations, growth trends, and monitoring history.
 *
 * @param {object} props
 * @param {object} [props.baseline] - Project baseline data
 * @param {Array<object>} [props.mrvRecords=[]] - List of MRV monitoring records
 * @param {Function} [props.onAddMRVRecord] - Handler when a new MRV record is added
 * @param {boolean} [props.canAddRecord=false] - Whether user has permissions to record observations
 * @param {string} [props.projectName='']
 */
const MRVSummary = ({
  baseline = null,
  mrvRecords = [],
  onAddMRVRecord,
  canAddRecord = false,
  projectName = '',
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  const latestMRV = mrvRecords.length > 0 ? mrvRecords[0] : null;

  const handleRecordSubmit = (record) => {
    if (onAddMRVRecord) {
      onAddMRVRecord(record);
    }
    setShowAddModal(false);
  };

  // Helper for NDVI health interpretation
  const getNDVILabel = (val) => {
    const n = Number(val);
    if (n >= 0.7) return { label: 'Vigorous / Dense Canopy', color: 'success' };
    if (n >= 0.5) return { label: 'Moderate Canopy', color: 'info' };
    if (n >= 0.3) return { label: 'Sparse Vegetation', color: 'warning' };
    return { label: 'Degraded / Non-Vegetated', color: 'danger' };
  };

  return (
    <div className="mrv-summary-container">
      {/* Top Controls Header */}
      <div className="mrv-summary-header">
        <div>
          <h3>Environmental Baseline & MRV Monitoring</h3>
          <p>
            Standardized Measurement, Reporting and Verification (MRV) indicators for {projectName || 'this blue carbon project'}.
          </p>
        </div>
        {canAddRecord && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setShowAddModal(true)}
          >
            <PlusCircle size={15} /> Record MRV Observation
          </Button>
        )}
      </div>

      {/* 1. Baseline Summary Section */}
      {baseline && baseline.projectArea ? (
        <div className="mrv-card-section">
          <div className="mrv-card-title">
            <TreePine size={18} className="text-primary" />
            <h4>Initial Environmental Baseline</h4>
            <span className="mrv-date-pill">
              <Calendar size={12} /> Surveyed:{' '}
              {baseline.assessmentDate || baseline.monitoringStartDate || 'Pre-Restoration'}
            </span>
          </div>

          <div className="mrv-stats-grid">
            <StatCard
              icon={<Layers size={20} />}
              value={`${baseline.projectArea || 0} ha`}
              label="Restoration Plot Area"
              trend={baseline.ecosystemType || 'Mangrove'}
            />
            <StatCard
              icon={<TreePine size={20} />}
              value={`${baseline.biomass || 0} t/ha`}
              label="Baseline Biomass"
              trend="Above & Belowground"
            />
            <StatCard
              icon={<Activity size={20} />}
              value={`${baseline.carbonStock || 0} tCO₂e`}
              label="Baseline Carbon Pool"
              trend={baseline.soilCarbon ? `Soil: ${baseline.soilCarbon} tC/ha` : 'Sediment & Plant'}
            />
            <StatCard
              icon={<TrendingUp size={20} />}
              value={`${baseline.sequestrationRate || 3.4} t/yr`}
              label="Sequestration Rate"
              trend="tCO₂e / hectare / year"
            />
          </div>

          {baseline.notes && (
            <div className="mrv-baseline-notes">
              <FileText size={14} />
              <span>
                <strong>Baseline Field Notes:</strong> {baseline.notes}
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="mrv-empty-baseline">
          <Info size={18} />
          <span>No specific baseline environmental dataset was registered for this project.</span>
        </div>
      )}

      {/* 2. Latest MRV Observation & Delta Comparison */}
      {latestMRV ? (
        <div className="mrv-card-section active-mrv">
          <div className="mrv-card-title">
            <Satellite size={18} className="text-secondary" />
            <h4>Latest Remote Sensing & Field Observation</h4>
            <span className="mrv-date-pill live">
              <Clock size={12} /> Logged: {latestMRV.monitoringDate} ({latestMRV.dataSource || 'Satellite'})
            </span>
          </div>

          <div className="mrv-stats-grid">
            {/* NDVI Gauge Card */}
            <div className="mrv-ndvi-card">
              <div className="ndvi-header">
                <span className="ndvi-title">Canopy Density (NDVI)</span>
                <span className={`ndvi-pill ${getNDVILabel(latestMRV.ndvi).color}`}>
                  {latestMRV.ndvi}
                </span>
              </div>
              <div className="ndvi-meter-bar">
                <div
                  className="ndvi-meter-fill"
                  style={{ width: `${Math.min(Math.max(latestMRV.ndvi * 100, 10), 100)}%` }}
                />
              </div>
              <span className="ndvi-desc">{getNDVILabel(latestMRV.ndvi).label}</span>
            </div>

            <StatCard
              icon={<TreePine size={20} />}
              value={`${latestMRV.biomass} t/ha`}
              label="Verified Biomass"
              trend={latestMRV.biomassChange || '+0.0%'}
              trendDirection={latestMRV.biomassChange?.startsWith('+') ? 'up' : 'neutral'}
            />

            <StatCard
              icon={<Activity size={20} />}
              value={`${latestMRV.carbonStock} tCO₂e`}
              label="Cumulative Carbon Stock"
              trend={latestMRV.carbonChange || '+0.0%'}
              trendDirection={latestMRV.carbonChange?.startsWith('+') ? 'up' : 'neutral'}
            />

            <StatCard
              icon={<ShieldCheck size={20} />}
              value={latestMRV.mangroveCondition || 'Healthy'}
              label="Canopy Condition Rating"
              trend={`Observed: ${latestMRV.observationDate || latestMRV.monitoringDate}`}
            />
          </div>

          {/* Biomass & Carbon Growth Comparison Progression */}
          {baseline && baseline.biomass && (
            <div className="mrv-progression-panel">
              <div className="progression-title">
                <TrendingUp size={15} />
                <span>MRV Growth Progress vs Initial Baseline</span>
              </div>
              <div className="progression-items">
                <div className="prog-item">
                  <span className="prog-label">Biomass (t/ha):</span>
                  <div className="prog-values">
                    <span className="old-val">{baseline.biomass}</span>
                    <span className="arrow">→</span>
                    <span className="new-val">{latestMRV.biomass}</span>
                    <span className="delta-badge positive">{latestMRV.biomassChange || '+0.0%'}</span>
                  </div>
                </div>

                <div className="prog-item">
                  <span className="prog-label">Carbon Stock (tCO₂e):</span>
                  <div className="prog-values">
                    <span className="old-val">{baseline.carbonStock}</span>
                    <span className="arrow">→</span>
                    <span className="new-val">{latestMRV.carbonStock}</span>
                    <span className="delta-badge positive">{latestMRV.carbonChange || '+0.0%'}</span>
                  </div>
                </div>

                <div className="prog-item">
                  <span className="prog-label">Canopy Area (ha):</span>
                  <div className="prog-values">
                    <span className="old-val">{baseline.projectArea}</span>
                    <span className="arrow">→</span>
                    <span className="new-val">{latestMRV.areaCovered || baseline.projectArea}</span>
                    <span className="delta-badge neutral">Stable</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<Satellite size={36} />}
          title="No MRV Monitoring Records Yet"
          description="Periodic satellite and field ground-truthing observations will appear here once monitoring passes are logged for this project."
        />
      )}

      {/* 3. Monitoring Timeline History */}
      {mrvRecords.length > 0 && (
        <div className="mrv-timeline-section">
          <h4>Historical Observation Log ({mrvRecords.length})</h4>
          <div className="mrv-timeline-list">
            {mrvRecords.map((rec, idx) => (
              <div key={rec.id || idx} className="mrv-timeline-card">
                <div className="timeline-badge-col">
                  <span className="timeline-dot" />
                  <span className="timeline-seq">#{mrvRecords.length - idx}</span>
                </div>
                <div className="timeline-body">
                  <div className="timeline-header-row">
                    <strong>{rec.dataSource || 'Satellite Observation'}</strong>
                    <span className="timeline-date">{rec.monitoringDate}</span>
                  </div>
                  <div className="timeline-metrics-pills">
                    <span>NDVI: <strong>{rec.ndvi}</strong></span>
                    <span>Biomass: <strong>{rec.biomass} t/ha</strong> ({rec.biomassChange})</span>
                    <span>Carbon: <strong>{rec.carbonStock} tCO₂e</strong> ({rec.carbonChange})</span>
                    <span className="condition-pill">{rec.mangroveCondition}</span>
                  </div>
                  {rec.notes && <p className="timeline-notes">"{rec.notes}"</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Recording New MRV Observation */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Record New MRV Observation Log"
        size="lg"
      >
        <MRVDataForm
          baseline={baseline || {}}
          onSubmit={handleRecordSubmit}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
};

export default MRVSummary;
