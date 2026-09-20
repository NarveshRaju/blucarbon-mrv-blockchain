import React, { useState } from 'react';
import {
  Satellite,
  Activity,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import {
  DATA_SOURCES,
  VEGETATION_CONDITIONS,
} from '../services/mockData';
import { Input, Select, Textarea, Button } from './ui';
import './MRVDataForm.css';

/**
 * MRV Data Entry Form for recording periodic monitoring observations.
 *
 * @param {object} props
 * @param {object} [props.baseline] - Baseline metrics for comparative delta calculations
 * @param {Function} props.onSubmit - Handler called with new MRV record object
 * @param {Function} [props.onCancel] - Cancel handler
 */
const MRVDataForm = ({
  baseline = {},
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    monitoringDate: new Date().toISOString().split('T')[0],
    observationDate: new Date().toISOString().split('T')[0],
    dataSource: 'Satellite Observation',
    ndvi: '0.68',
    evi: '0.52',
    biomass: baseline.biomass ? (baseline.biomass * 1.15).toFixed(1) : '48.0',
    carbonStock: baseline.carbonStock ? (baseline.carbonStock * 1.16).toFixed(1) : '75.0',
    areaCovered: baseline.projectArea || '25.0',
    mangroveCondition: 'Improving',
    biomassChange: '+15.0%',
    carbonChange: '+16.0%',
    areaChange: '0.0%',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // Automatically recalculate simple percentage deltas relative to baseline if available
      if (field === 'biomass' && baseline.biomass && Number(baseline.biomass) > 0) {
        const diff = ((Number(value) - Number(baseline.biomass)) / Number(baseline.biomass)) * 100;
        updated.biomassChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
      }
      if (field === 'carbonStock' && baseline.carbonStock && Number(baseline.carbonStock) > 0) {
        const diff = ((Number(value) - Number(baseline.carbonStock)) / Number(baseline.carbonStock)) * 100;
        updated.carbonChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.monitoringDate) newErrors.monitoringDate = 'Monitoring date is required';
    if (!formData.ndvi) newErrors.ndvi = 'NDVI value is required';
    if (Number(formData.ndvi) < -1 || Number(formData.ndvi) > 1) {
      newErrors.ndvi = 'NDVI must be between -1.0 and +1.0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (onSubmit) {
      onSubmit({
        ...formData,
        ndvi: Number(formData.ndvi),
        evi: Number(formData.evi || 0),
        biomass: Number(formData.biomass || 0),
        carbonStock: Number(formData.carbonStock || 0),
        areaCovered: Number(formData.areaCovered || 0),
        recordedAt: new Date().toISOString(),
      });
    }
  };

  return (
    <form className="mrv-form-container" onSubmit={handleSubmit}>
      {/* Informational Academic Note */}
      <div className="mrv-info-notice">
        <Satellite size={20} />
        <div>
          <strong>MRV Remote Sensing & Satellite Pipeline:</strong>
          <p>
            These monitoring values represent project-level MRV observation data. In production deployments,
            values such as NDVI, EVI, estimated biomass, and canopy cover are derived using satellite imagery (Sentinel-2 / Landsat)
            and calibrated allometric AI algorithms.
          </p>
        </div>
      </div>

      {/* Section A: Monitoring Details */}
      <div className="mrv-form-section">
        <div className="mrv-section-title">
          <Satellite size={16} />
          <h4>A. Observation Details & Data Source</h4>
        </div>

        <div className="mrv-grid-3">
          <Input
            id="mrv-monDate"
            label="Monitoring Log Date"
            type="date"
            value={formData.monitoringDate}
            onChange={(e) => handleChange('monitoringDate', e.target.value)}
            error={errors.monitoringDate}
            required
          />

          <Input
            id="mrv-obsDate"
            label="Satellite / Survey Pass Date"
            type="date"
            value={formData.observationDate}
            onChange={(e) => handleChange('observationDate', e.target.value)}
            required
          />

          <Select
            id="mrv-source"
            label="Data Provenance / Source"
            value={formData.dataSource}
            onChange={(e) => handleChange('dataSource', e.target.value)}
            options={DATA_SOURCES}
            required
          />
        </div>
      </div>

      {/* Section B: Environmental Metrics */}
      <div className="mrv-form-section">
        <div className="mrv-section-title">
          <Activity size={16} />
          <h4>B. Vegetation & Carbon Metrics</h4>
        </div>

        <div className="mrv-grid-3">
          <Input
            id="mrv-ndvi"
            label="Normalized Difference Veg. Index (NDVI)"
            type="number"
            min="-1"
            max="1"
            step="0.01"
            value={formData.ndvi}
            onChange={(e) => handleChange('ndvi', e.target.value)}
            error={errors.ndvi}
            helperText="Vegetation density (typical healthy: 0.60–0.85)"
            required
          />

          <Input
            id="mrv-evi"
            label="Enhanced Vegetation Index (EVI)"
            type="number"
            min="-1"
            max="1"
            step="0.01"
            value={formData.evi}
            onChange={(e) => handleChange('evi', e.target.value)}
            helperText="Canopy background adjusted index"
          />

          <Select
            id="mrv-condition"
            label="Mangrove Canopy Health Rating"
            value={formData.mangroveCondition}
            onChange={(e) => handleChange('mangroveCondition', e.target.value)}
            options={VEGETATION_CONDITIONS}
          />
        </div>

        <div className="mrv-grid-3">
          <Input
            id="mrv-biomass"
            label="Estimated Biomass (t/ha)"
            type="number"
            step="0.1"
            value={formData.biomass}
            onChange={(e) => handleChange('biomass', e.target.value)}
            helperText="Above & belowground living biomass"
          />

          <Input
            id="mrv-carbon"
            label="Current Carbon Stock (tCO₂e)"
            type="number"
            step="0.1"
            value={formData.carbonStock}
            onChange={(e) => handleChange('carbonStock', e.target.value)}
            helperText="Total cumulative carbon sequestration"
          />

          <Input
            id="mrv-area"
            label="Effective Canopy Area (ha)"
            type="number"
            step="0.1"
            value={formData.areaCovered}
            onChange={(e) => handleChange('areaCovered', e.target.value)}
            helperText="Verified vegetated surface area"
          />
        </div>
      </div>

      {/* Section C: Change Metrics & Notes */}
      <div className="mrv-form-section">
        <div className="mrv-section-title">
          <TrendingUp size={16} />
          <h4>C. Growth Delta & Verification Notes</h4>
        </div>

        <div className="mrv-grid-3">
          <Input
            id="mrv-bioChange"
            label="Biomass Change vs Baseline"
            value={formData.biomassChange}
            onChange={(e) => handleChange('biomassChange', e.target.value)}
            placeholder="e.g. +15.0%"
          />

          <Input
            id="mrv-carbChange"
            label="Carbon Stock Delta"
            value={formData.carbonChange}
            onChange={(e) => handleChange('carbonChange', e.target.value)}
            placeholder="e.g. +16.0%"
          />

          <Input
            id="mrv-areaChange"
            label="Area Expansion Delta"
            value={formData.areaChange}
            onChange={(e) => handleChange('areaChange', e.target.value)}
            placeholder="e.g. 0.0%"
          />
        </div>

        <Textarea
          id="mrv-notes"
          label="Monitoring Summary & Surveyor Notes"
          value={formData.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Document sensor quality, weather conditions, tidal coverage, or ground-truthing notes..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="mrv-actions-row">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary">
          <CheckCircle2 size={16} /> Record MRV Observation
        </Button>
      </div>
    </form>
  );
};

export default MRVDataForm;
