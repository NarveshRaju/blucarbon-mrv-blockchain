import React from 'react';
import {
  TreePine,
  Activity,
  FileText,
  Info,
  ShieldCheck
} from 'lucide-react';
import {
  ECOSYSTEM_TYPES,
  MANGROVE_CATEGORIES,
  RESTORATION_TYPES,
  VEGETATION_CONDITIONS,
} from '../services/mockData';
import { Input, Select, Textarea } from './ui';
import './BaselineDataForm.css';

/**
 * Reusable Baseline Environmental Data Form component.
 * Allows NGOs to enter initial ecosystem, biomass, and carbon baseline metrics.
 *
 * @param {object} props
 * @param {object} props.data - Baseline form data state
 * @param {Function} props.onChange - Handler called when any field changes (field, value)
 * @param {object} [props.errors={}] - Validation errors
 * @param {boolean} [props.readOnly=false] - View-only mode
 */
const BaselineDataForm = ({
  data = {},
  onChange,
  errors = {},
  readOnly = false,
}) => {
  const handleChange = (field, value) => {
    if (readOnly || !onChange) return;
    onChange(field, value);
  };

  return (
    <div className="baseline-form-container">
      {/* Informational Academic Banner */}
      <div className="baseline-info-banner">
        <Info size={20} />
        <div>
          <strong>Academic & Prototype Notice:</strong>
          <p>
            Baseline environmental metrics represent pre-restoration field measurements and baseline estimates.
            In production deployments, these values can be coupled with historical satellite archives (e.g. Landsat-8/Sentinel-2) and verified field sample plots.
          </p>
        </div>
      </div>

      {/* Section A: Project & Ecosystem Scope */}
      <div className="baseline-section">
        <div className="baseline-section-header">
          <TreePine size={18} className="text-primary" />
          <div>
            <h3>A. Project Ecosystem & Area Scope</h3>
            <p>Define the target coastal habitat and restoration intervention type.</p>
          </div>
        </div>

        <div className="baseline-grid-2">
          <Input
            id="bl-projectArea"
            label="Project Area (Hectares)"
            type="number"
            min="0.1"
            step="0.1"
            placeholder="e.g. 25.5"
            value={data.projectArea || ''}
            onChange={(e) => handleChange('projectArea', e.target.value)}
            error={errors.projectArea}
            helperText="Total contiguous restoration plot area in hectares (ha)"
            disabled={readOnly}
            required
          />

          <Select
            id="bl-ecosystemType"
            label="Ecosystem Classification"
            value={data.ecosystemType || 'Mangrove Forest'}
            onChange={(e) => handleChange('ecosystemType', e.target.value)}
            options={ECOSYSTEM_TYPES}
            disabled={readOnly}
            required
          />
        </div>

        <div className="baseline-grid-2">
          <Select
            id="bl-mangroveCategory"
            label="Dominant Mangrove Species / Category"
            value={data.mangroveCategory || 'Rhizophora (Red Mangrove)'}
            onChange={(e) => handleChange('mangroveCategory', e.target.value)}
            options={MANGROVE_CATEGORIES}
            disabled={readOnly}
          />

          <Select
            id="bl-restorationType"
            label="Restoration / Intervention Type"
            value={data.restorationType || 'Reforestation'}
            onChange={(e) => handleChange('restorationType', e.target.value)}
            options={RESTORATION_TYPES}
            disabled={readOnly}
          />
        </div>

        <div className="baseline-grid-2">
          <Input
            id="bl-monitoringStartDate"
            label="Monitoring Start Date"
            type="date"
            value={data.monitoringStartDate || ''}
            onChange={(e) => handleChange('monitoringStartDate', e.target.value)}
            error={errors.monitoringStartDate}
            helperText="Official project launch / baseline survey start date"
            disabled={readOnly}
            required
          />

          <Input
            id="bl-assessmentDate"
            label="Baseline Assessment Date"
            type="date"
            value={data.assessmentDate || ''}
            onChange={(e) => handleChange('assessmentDate', e.target.value)}
            error={errors.assessmentDate}
            helperText="Date when initial ground survey was conducted"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Section B: Baseline Environmental Metrics */}
      <div className="baseline-section">
        <div className="baseline-section-header">
          <Activity size={18} className="text-secondary" />
          <div>
            <h3>B. Baseline Environmental Metrics (Pre-Restoration)</h3>
            <p>Record initial biomass, soil carbon, and carbon stock estimates.</p>
          </div>
        </div>

        <div className="baseline-grid-2">
          <Select
            id="bl-vegetationCondition"
            label="Initial Vegetation Condition"
            value={data.vegetationCondition || 'Moderate'}
            onChange={(e) => handleChange('vegetationCondition', e.target.value)}
            options={VEGETATION_CONDITIONS}
            disabled={readOnly}
            helperText="Pre-existing canopy health prior to restoration"
          />

          <Input
            id="bl-biomass"
            label="Baseline Biomass (t/ha)"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 42.5"
            value={data.biomass || ''}
            onChange={(e) => handleChange('biomass', e.target.value)}
            error={errors.biomass}
            helperText="Above & belowground living plant matter (tonnes dry matter / hectare)"
            disabled={readOnly}
          />
        </div>

        <div className="baseline-grid-3">
          <Input
            id="bl-carbonStock"
            label="Estimated Carbon Stock (tCO₂e)"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 68.2"
            value={data.carbonStock || ''}
            onChange={(e) => handleChange('carbonStock', e.target.value)}
            error={errors.carbonStock}
            helperText="Total baseline carbon pool (tonnes CO₂ equivalent)"
            disabled={readOnly}
          />

          <Input
            id="bl-soilCarbon"
            label="Soil Organic Carbon (tC/ha)"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 110.0"
            value={data.soilCarbon || ''}
            onChange={(e) => handleChange('soilCarbon', e.target.value)}
            helperText="Organic carbon stored in coastal sediment"
            disabled={readOnly}
          />

          <Input
            id="bl-sequestrationRate"
            label="Est. Sequestration Rate (tCO₂e/yr)"
            type="number"
            min="0"
            step="0.1"
            placeholder="e.g. 3.4"
            value={data.sequestrationRate || ''}
            onChange={(e) => handleChange('sequestrationRate', e.target.value)}
            helperText="Projected annual CO₂ capture per hectare"
            disabled={readOnly}
          />
        </div>
      </div>

      {/* Section C: Baseline Description & Notes */}
      <div className="baseline-section">
        <div className="baseline-section-header">
          <FileText size={18} className="text-info" />
          <div>
            <h3>C. Baseline Assessment Notes & Site Conditions</h3>
            <p>Document field observations, tidal hydrology, soil type, and pre-restoration context.</p>
          </div>
        </div>

        <Textarea
          id="bl-notes"
          label="Baseline Field Observations & Method Notes"
          placeholder="Describe initial site conditions, soil salinity, tidal immersion patterns, community participation, or historical degradation causes..."
          value={data.notes || ''}
          onChange={(e) => handleChange('notes', e.target.value)}
          rows={3}
          disabled={readOnly}
          helperText="Supporting notes available to validators during MRV review."
        />
      </div>

      {/* Verification Notice */}
      <div className="baseline-footer-note">
        <ShieldCheck size={16} />
        <span>
          Baseline data forms the reference point against which periodic MRV monitoring records and carbon credit issuance are audited.
        </span>
      </div>
    </div>
  );
};

export default BaselineDataForm;
