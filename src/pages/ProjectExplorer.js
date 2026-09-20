import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useWeb3 } from '../Web3Context';
import { getProjects } from '../services/projectService';
import {
  normalizeProjectForExplorer,
  getExplorerSummary,
  filterExplorerProjects,
  sortExplorerProjects
} from '../utils/projectExplorerUtils';
import ProjectCard from '../components/ProjectCard';
import ProjectExplorerMap from '../components/ProjectExplorerMap';
import ProjectComparison from '../components/ProjectComparison';
import {
  StatCard,
  Button,
  Select,
  LoadingSpinner,
  EmptyState,
  ErrorState
} from '../components/ui';
import {
  Globe,
  Globe2,
  X,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  Map as MapIcon,
  RotateCcw,
  Sparkles,
  TreePine,
  ShieldCheck,
  Layers,
  BarChart2
} from 'lucide-react';
import './ProjectExplorer.css';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'under_verification', label: 'Under Verification' },
  { value: 'approved', label: 'Approved' },
  { value: 'dao_review', label: 'DAO Review' },
  { value: 'credit_issued', label: 'Credit Issued' },
  { value: 'rejected', label: 'Requires Revision' },
];

const ECOSYSTEM_OPTIONS = [
  { value: 'all', label: 'All Ecosystems' },
  { value: 'mangrove', label: 'Mangrove' },
  { value: 'seagrass', label: 'Seagrass' },
  { value: 'salt marsh', label: 'Salt Marsh' },
  { value: 'tidal wetland', label: 'Tidal Wetland' },
  { value: 'other', label: 'Other' },
];

const MRV_OPTIONS = [
  { value: 'all', label: 'All MRV Statuses' },
  { value: 'baseline_ready', label: 'Baseline Ready' },
  { value: 'monitoring_active', label: 'Monitoring Active' },
  { value: 'verified', label: 'MRV Verified' },
  { value: 'baseline_required', label: 'Baseline Pending' },
];

const EVIDENCE_OPTIONS = [
  { value: 'all', label: 'All Evidence' },
  { value: 'has_evidence', label: 'Evidence Available' },
  { value: 'no_evidence', label: 'No Evidence' },
];

const AREA_OPTIONS = [
  { value: 'all', label: 'Any Area Size' },
  { value: 'small', label: 'Small (< 10 ha)' },
  { value: 'medium', label: 'Medium (10 – 100 ha)' },
  { value: 'large', label: 'Large (> 100 ha)' },
];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Added' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'name_asc', label: 'Project Name (A – Z)' },
  { value: 'name_desc', label: 'Project Name (Z – A)' },
  { value: 'area_desc', label: 'Largest Project Area' },
  { value: 'area_asc', label: 'Smallest Project Area' },
  { value: 'carbon_desc', label: 'Highest Carbon Stock' },
];

const ProjectExplorer = () => {
  const { userAddress } = useWeb3();
  const [rawProjects, setRawProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View Mode: 'grid' | 'map'
  const [viewMode, setViewMode] = useState('grid');

  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [ecosystemFilter, setEcosystemFilter] = useState('all');
  const [mrvFilter, setMrvFilter] = useState('all');
  const [evidenceFilter, setEvidenceFilter] = useState('all');
  const [areaFilter, setAreaFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Selected Projects for Comparison (max 3)
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Fetch Project Data via projectService
  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProjects();
      setRawProjects(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load explorer projects:', err);
      setError('Unable to load blue carbon projects. Please check your connectivity and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Overall Platform Summary Metrics
  const summary = useMemo(() => {
    return getExplorerSummary(rawProjects);
  }, [rawProjects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    const filters = {
      searchQuery,
      status: statusFilter,
      ecosystem: ecosystemFilter,
      mrvStatus: mrvFilter,
      evidenceStatus: evidenceFilter,
      areaRange: areaFilter,
    };
    const filtered = filterExplorerProjects(rawProjects, filters);
    return sortExplorerProjects(filtered, sortBy);
  }, [rawProjects, searchQuery, statusFilter, ecosystemFilter, mrvFilter, evidenceFilter, areaFilter, sortBy]);

  // Comparison toggle handler
  const handleToggleSelect = (project) => {
    const norm = normalizeProjectForExplorer(project);
    const pid = norm.id;
    if (selectedForCompare.some((p) => (p.projectId || p._id || p.id) === pid)) {
      setSelectedForCompare((prev) => prev.filter((p) => (p.projectId || p._id || p.id) !== pid));
    } else {
      if (selectedForCompare.length >= 3) {
        alert('You can select up to 3 projects for comparative evaluation.');
        return;
      }
      setSelectedForCompare((prev) => [...prev, project]);
    }
  };

  const handleRemoveCompare = (pid) => {
    setSelectedForCompare((prev) => prev.filter((p) => (p.projectId || p._id || p.id) !== pid));
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setEcosystemFilter('all');
    setMrvFilter('all');
    setEvidenceFilter('all');
    setAreaFilter('all');
    setSortBy('recent');
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || ecosystemFilter !== 'all' ||
    mrvFilter !== 'all' || evidenceFilter !== 'all' || areaFilter !== 'all' || sortBy !== 'recent';

  return (
    <div className="project-explorer-page">
      <div className="explorer-content-container">
        {/* Explorer Header */}
        <div className="explorer-hero">
          <div className="eh-badge">
            <Globe2 size={15} />
            <span>Decentralized Ecological Registry</span>
          </div>
          <h1>Explore Blue Carbon Projects</h1>
          <p>
            Discover verified mangrove, seagrass, and tidal wetland restoration plots monitored through the BlueChain MRV verification workflow.
          </p>
        </div>

        {/* Dynamic Platform Summary Cards */}
        <section className="explorer-summary-grid">
          <StatCard
            icon={<Layers size={22} />}
            value={summary.total}
            label="Total Projects"
            accent="primary"
          />
          <StatCard
            icon={<TreePine size={22} />}
            value={`${summary.totalArea.toLocaleString()} ha`}
            label="Protected Area"
            accent="secondary"
          />
          <StatCard
            icon={<Sparkles size={22} />}
            value={`${summary.totalCarbon.toLocaleString()} tCO₂e`}
            label="Baseline Carbon Pool"
            accent="info"
          />
          <StatCard
            icon={<Search size={22} />}
            value={summary.underVerification}
            label="In Verification Queue"
            accent="warning"
          />
          <StatCard
            icon={<ShieldCheck size={22} />}
            value={summary.approved}
            label="Certified / Approved"
            accent="success"
          />
        </section>

        {/* Search, Filter & View Controls Bar */}
        <div className="explorer-controls-card">
          <div className="controls-top-row">
            {/* Search Input */}
            <div className="explorer-search-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="explorer-search-input"
                placeholder="Search projects by name, location, ecosystem or NGO steward..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`vmt-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <LayoutGrid size={16} /> Grid View
              </button>
              <button
                type="button"
                className={`vmt-btn ${viewMode === 'map' ? 'active' : ''}`}
                onClick={() => setViewMode('map')}
                title="Interactive Map View"
              >
                <MapIcon size={16} /> Map View
              </button>
            </div>

            {/* Mobile Filter Toggle */}
            <button
              type="button"
              className="mobile-filter-btn"
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            >
              <SlidersHorizontal size={16} /> Filters {hasActiveFilters && '•'}
            </button>
          </div>

          {/* Filter Bar */}
          <div className={`controls-filters-row ${showFilterDrawer ? 'drawer-open' : ''}`}>
            <div className="filter-select-group">
              <Select
                name="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={STATUS_OPTIONS}
              />

              <Select
                name="ecosystemFilter"
                value={ecosystemFilter}
                onChange={(e) => setEcosystemFilter(e.target.value)}
                options={ECOSYSTEM_OPTIONS}
              />

              <Select
                name="mrvFilter"
                value={mrvFilter}
                onChange={(e) => setMrvFilter(e.target.value)}
                options={MRV_OPTIONS}
              />

              <Select
                name="evidenceFilter"
                value={evidenceFilter}
                onChange={(e) => setEvidenceFilter(e.target.value)}
                options={EVIDENCE_OPTIONS}
              />

              <Select
                name="areaFilter"
                value={areaFilter}
                onChange={(e) => setAreaFilter(e.target.value)}
                options={AREA_OPTIONS}
              />
            </div>

            <div className="filter-sort-group">
              <Select
                name="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={SORT_OPTIONS}
              />

              {hasActiveFilters && (
                <button
                  type="button"
                  className="reset-filters-btn"
                  onClick={handleResetFilters}
                  title="Reset all filters"
                >
                  <RotateCcw size={14} /> Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Selected Compare Tray Banner */}
        {selectedForCompare.length > 0 && (
          <div className="compare-bar-alert">
            <div className="compare-bar-info">
              <Sparkles size={16} />
              <span>
                <strong>{selectedForCompare.length} of 3 projects</strong> selected for side-by-side technical comparison.
              </span>
            </div>
            <div className="compare-bar-actions">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCompareOpen(true)}
                icon={<BarChart2 size={14} />}
              >
                Open Comparison ({selectedForCompare.length})
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedForCompare([])}
              >
                Clear Selection
              </Button>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div className="explorer-results-header">
          <span className="results-count">
            Showing <strong>{filteredProjects.length}</strong> of {rawProjects.length} registered projects
          </span>

          {!userAddress && (
            <span className="public-mode-indicator">
              <Globe size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Public Discovery Mode (Connect wallet for stewardship & voting actions)
            </span>
          )}
        </div>

        {/* Loading & Error States */}
        {loading && (
          <div className="explorer-loading-wrap">
            <LoadingSpinner text="Scanning blue carbon registry..." />
          </div>
        )}

        {error && !loading && (
          <div className="explorer-error-wrap">
            <ErrorState
              title="Registry Error"
              message={error}
              onRetry={loadProjects}
            />
          </div>
        )}

        {/* Results Presentation (Grid vs Map) */}
        {!loading && !error && (
          <>
            {filteredProjects.length === 0 ? (
              <div className="explorer-empty-wrap">
                <EmptyState
                  icon={<Search size={36} />}
                  title="No Matching Blue Carbon Projects Found"
                  description="We couldn't find any registered restoration sites matching your current search and filter parameters."
                  action={
                    hasActiveFilters ? (
                      <Button variant="outline" onClick={handleResetFilters} icon={<RotateCcw size={14} />}>
                        Clear Search & Filters
                      </Button>
                    ) : null
                  }
                />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="explorer-projects-grid">
                {filteredProjects.map((project) => {
                  const pid = project.projectId || project._id || project.id;
                  const isSelected = selectedForCompare.some(
                    (p) => (p.projectId || p._id || p.id) === pid
                  );

                  return (
                    <ProjectCard
                      key={pid}
                      project={project}
                      showViewButton={true}
                      linkPrefix="/project"
                      isSelectable={true}
                      isSelected={isSelected}
                      onToggleSelect={handleToggleSelect}
                    />
                  );
                })}
              </div>
            ) : (
              <ProjectExplorerMap projects={filteredProjects} />
            )}
          </>
        )}
      </div>

      {/* Lightweight Project Comparison Modal */}
      <ProjectComparison
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        projects={selectedForCompare}
        onRemoveProject={handleRemoveCompare}
      />
    </div>
  );
};

export default ProjectExplorer;
