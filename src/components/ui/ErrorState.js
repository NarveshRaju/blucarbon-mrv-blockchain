import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Reusable error state display for API or runtime errors.
 * Shows a user-friendly message instead of raw technical errors.
 *
 * @param {object} props
 * @param {string} [props.title='Something went wrong']
 * @param {string} [props.message='Please try again later.']
 * @param {Function} [props.onRetry] - Optional retry callback
 * @param {string} [props.className]
 */
const ErrorState = ({
  title = 'Something went wrong',
  message = 'Please try again later.',
  onRetry,
  className = '',
}) => (
  <div className={`bc-error-state ${className}`}>
    <div className="bc-error-state__icon">
      <AlertTriangle size={24} />
    </div>
    <h3 className="bc-error-state__title">{title}</h3>
    <p className="bc-error-state__message">{message}</p>
    {onRetry && (
      <button className="bc-btn bc-btn--secondary" onClick={onRetry}>
        Try Again
      </button>
    )}
  </div>
);

export default ErrorState;
