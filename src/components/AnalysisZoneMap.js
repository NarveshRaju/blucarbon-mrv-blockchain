import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  isValidCoordinate,
  formatCoordinate,
  formatRadius,
  estimateZoneAreaHectares,
  DEFAULT_ANALYSIS_RADIUS_METERS
} from '../utils/geoUtils';
import { Satellite, Info, Layers, Globe } from 'lucide-react';
import './AnalysisZoneMap.css';

// Fix Leaflet default marker icons for React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

/**
 * Reusable Read-Only Analysis Zone Map Component for displaying project geographical data.
 *
 * @param {object} props
 * @param {number|string} props.latitude - Reference latitude
 * @param {number|string} props.longitude - Reference longitude
 * @param {number|string} [props.radius=500] - Analysis radius in meters
 * @param {string} [props.projectName] - Project title
 * @param {string} [props.locationName] - Descriptive location name
 * @param {string} [props.className]
 */
const AnalysisZoneMap = ({
  latitude,
  longitude,
  radius = DEFAULT_ANALYSIS_RADIUS_METERS,
  projectName = 'Project Reference Area',
  locationName = '',
  className = '',
}) => {
  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const radiusMeters = parseInt(radius, 10) || DEFAULT_ANALYSIS_RADIUS_METERS;
  const hasCoords = isValidCoordinate(lat, lng);

  const estimatedHectares = useMemo(() => estimateZoneAreaHectares(radiusMeters), [radiusMeters]);

  if (!hasCoords) {
    return (
      <div className={`analysis-zone-empty-card ${className}`}>
        <Globe size={32} className="text-muted" />
        <div>
          <h4>Geographic Location Coordinates Unavailable</h4>
          <p>
            This project was submitted prior to map-based coordinate capture. Text location: <em>{locationName || 'Not specified'}</em>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`analysis-zone-map-container ${className}`}>
      {/* Map Header Meta Bar */}
      <div className="azm-header">
        <div className="azm-title">
          <Satellite size={18} className="text-primary" />
          <div>
            <strong>Project Location & Initial Analysis Zone</strong>
            <span>{locationName ? locationName : `${formatCoordinate(lat, 'lat')}, ${formatCoordinate(lng, 'lng')}`}</span>
          </div>
        </div>
        <div className="azm-badge-group">
          <span className="azm-radius-badge">
            <Layers size={13} /> {formatRadius(radiusMeters)} Radius (~{estimatedHectares} ha)
          </span>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="azm-map-wrapper">
        <MapContainer
          center={[lat, lng]}
          zoom={13}
          scrollWheelZoom={false}
          className="azm-leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Marker position={[lat, lng]}>
            <Popup>
              <div className="azm-popup">
                <strong>{projectName}</strong>
                <p>{locationName || 'Restoration site center'}</p>
                <small>{formatCoordinate(lat, 'lat')}, {formatCoordinate(lng, 'lng')}</small>
              </div>
            </Popup>
          </Marker>

          <Circle
            center={[lat, lng]}
            radius={radiusMeters}
            pathOptions={{
              color: '#0e9aa7',
              fillColor: '#0e9aa7',
              fillOpacity: 0.2,
              weight: 2,
              dashArray: '6, 6',
            }}
          />
        </MapContainer>
      </div>

      {/* Footer Details & Academic Disclaimer */}
      <div className="azm-footer-grid">
        <div className="azm-coord-readout">
          <div>
            <span className="azm-label">Latitude:</span>
            <code>{formatCoordinate(lat, 'lat', 6)} ({lat.toFixed(6)})</code>
          </div>
          <div>
            <span className="azm-label">Longitude:</span>
            <code>{formatCoordinate(lng, 'lng', 6)} ({lng.toFixed(6)})</code>
          </div>
          <div>
            <span className="azm-label">Monitoring Radius:</span>
            <strong>{formatRadius(radiusMeters)}</strong>
          </div>
        </div>

        <div className="azm-disclaimer-note">
          <Info size={15} />
          <span>
            This analysis zone represents the approximate {estimatedHectares} ha monitoring area generated around the selected project coordinates for future satellite-based MRV vegetation indices.
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalysisZoneMap;
