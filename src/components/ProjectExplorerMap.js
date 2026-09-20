import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { normalizeProjectForExplorer } from '../utils/projectExplorerUtils';
import { formatProjectId } from '../utils/projectStatus';
import { EmptyState, StatusBadge } from './ui';
import { MapPin, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import './ProjectExplorerMap.css';

// Fix Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically fit map bounds to current markers
function MapBoundsAdjuster({ validProjects }) {
  const map = useMap();

  useEffect(() => {
    if (!validProjects || validProjects.length === 0) return;

    try {
      const latLngs = validProjects.map((p) => [p.latitude, p.longitude]);
      if (latLngs.length === 1) {
        map.setView(latLngs[0], 12);
      } else if (latLngs.length > 1) {
        const bounds = L.latLngBounds(latLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      }
    } catch (e) {
      console.warn('Map bound adjustment error:', e);
    }
  }, [validProjects, map]);

  return null;
}

/**
 * ProjectExplorerMap Component.
 * Interactive geographic view for browsing blue carbon projects on Leaflet.
 *
 * @param {object} props
 * @param {Array<object>} props.projects - List of projects
 * @param {string} [props.className='']
 */
const ProjectExplorerMap = ({ projects = [], className = '' }) => {
  const validProjects = useMemo(() => {
    return projects
      .map((p) => normalizeProjectForExplorer(p))
      .filter((p) => p && p.hasValidCoordinates);
  }, [projects]);

  if (validProjects.length === 0) {
    return (
      <div className="explorer-map-empty-wrap">
        <EmptyState
          icon={<MapPin size={36} />}
          title="No Geotagged Projects Available"
          description="None of the projects matching the selected search and filter criteria have verified location coordinates."
        />
      </div>
    );
  }

  // Initial center position (fallback to first valid project)
  const defaultCenter = [validProjects[0].latitude, validProjects[0].longitude];

  return (
    <div className={`explorer-map-container ${className}`}>
      <div className="explorer-map-header">
        <div className="emh-left">
          <MapPin size={18} className="text-primary" />
          <strong>Showing {validProjects.length} Geotagged Project Sites</strong>
        </div>
        <span className="emh-hint">Click any pin to inspect restoration boundaries and metrics</span>
      </div>

      <div className="explorer-leaflet-wrapper">
        <MapContainer
          center={defaultCenter}
          zoom={6}
          scrollWheelZoom={true}
          style={{ width: '100%', height: '100%', minHeight: '520px', borderRadius: '12px' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapBoundsAdjuster validProjects={validProjects} />

          {validProjects.map((p) => {
            const pid = p.projectId || p._id || p.id;
            const statusConfig = p.statusConfig;

            return (
              <React.Fragment key={pid}>
                {/* Satellite Analysis Zone Buffer Circle */}
                <Circle
                  center={[p.latitude, p.longitude]}
                  radius={p.analysisRadius || 500}
                  pathOptions={{
                    color: statusConfig.color || '#1a73e8',
                    fillColor: statusConfig.color || '#1a73e8',
                    fillOpacity: 0.15,
                    weight: 2,
                    dashArray: '4, 4',
                  }}
                />

                {/* Location Marker */}
                <Marker position={[p.latitude, p.longitude]}>
                  <Popup className="explorer-map-popup">
                    <div className="emp-card">
                      <div className="emp-header">
                        <span className="emp-pid">{formatProjectId(pid)}</span>
                        <StatusBadge status={p.rawStatus} />
                      </div>

                      <h4 className="emp-title">{p.name}</h4>
                      <p className="emp-location"><MapPin size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {p.location}</p>

                      <div className="emp-stats-grid">
                        <div className="emp-stat">
                          <span className="emp-label">Ecosystem</span>
                          <span className="emp-val">{p.plantationType}</span>
                        </div>
                        <div className="emp-stat">
                          <span className="emp-label">Project Area</span>
                          <span className="emp-val">{p.areaHectares} ha</span>
                        </div>
                        <div className="emp-stat">
                          <span className="emp-label">Saplings</span>
                          <span className="emp-val">{p.saplings?.toLocaleString()}</span>
                        </div>
                        <div className="emp-stat">
                          <span className="emp-label">MRV Status</span>
                          <span className="emp-val">{p.mrvStatus.label}</span>
                        </div>
                      </div>

                      <Link to={`/project/${pid}`} className="emp-view-btn">
                        View Project Details <ExternalLink size={13} />
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};

export default ProjectExplorerMap;
