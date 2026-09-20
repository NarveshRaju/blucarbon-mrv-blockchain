import React from 'react';

/**
 * Displays a project or workflow status as a colored pill.
 *
 * Supports: pending, approved, rejected, submitted, under_review, verified, draft.
 * Normalizes input text (e.g. 'Under Review' → 'under_review') for CSS matching.
 *
 * @param {object} props
 * @param {string} props.status - Status string (case-insensitive)
 * @param {string} [props.className]
 */
const StatusBadge = ({ status, className = '' }) => {
  if (!status) return null;

  // Normalize: lowercase, replace spaces with underscores
  const normalized = status.toLowerCase().replace(/\s+/g, '_');

  // Display label: replace underscores with spaces, capitalize first letter of each word
  const label = status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const classes = [
    'bc-status-badge',
    `bc-status-badge--${normalized}`,
    className,
  ].filter(Boolean).join(' ');

  return <span className={classes}>{label}</span>;
};

export default StatusBadge;
