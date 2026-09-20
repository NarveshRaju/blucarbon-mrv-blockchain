import React from 'react';

/**
 * Reusable loading spinner with optional text.
 *
 * @param {object} props
 * @param {string} [props.text='Loading...']
 * @param {string} [props.className]
 */
const LoadingSpinner = ({ text = 'Loading...', className = '' }) => (
  <div className={`bc-loading ${className}`}>
    <div className="bc-loading__spinner" />
    {text && <p className="bc-loading__text">{text}</p>}
  </div>
);

export default LoadingSpinner;
