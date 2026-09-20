import React from 'react';

/**
 * Reusable StatCard for displaying a metric with icon, value, and label.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Icon element (e.g. lucide-react icon)
 * @param {string|number} props.value - The metric value
 * @param {string} props.label - Description of the metric
 * @param {'primary'|'success'|'warning'|'error'|'secondary'|'info'} [props.accent='primary']
 * @param {string} [props.className]
 */
const StatCard = ({
  icon,
  value,
  label,
  accent = 'primary',
  className = '',
}) => {
  return (
    <div className={`bc-stat-card ${className}`}>
      {icon && (
        <div className={`bc-stat-card__icon bc-stat-card__icon--${accent}`}>
          {icon}
        </div>
      )}
      <div className="bc-stat-card__content">
        <span className="bc-stat-card__value">{value}</span>
        <span className="bc-stat-card__label">{label}</span>
      </div>
    </div>
  );
};

export default StatCard;
