import React from 'react';

/**
 * Reusable Textarea component with label, hint, and error support.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {boolean} [props.required=false]
 * @param {number} [props.rows=4]
 * @param {string} [props.className]
 * @param {string} [props.id]
 */
const Textarea = React.forwardRef(({
  label,
  hint,
  helperText,
  error,
  required = false,
  rows = 4,
  className = '',
  id,
  ...rest
}, ref) => {
  const textareaId = id || (label ? `bc-textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const displayHint = helperText || hint;

  const textareaClasses = [
    'bc-textarea',
    error ? 'bc-textarea--error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="bc-form-group">
      {label && (
        <label
          htmlFor={textareaId}
          className={`bc-form-label ${required ? 'bc-form-label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        className={textareaClasses}
        rows={rows}
        required={required}
        {...rest}
      />
      {displayHint && !error && <span className="bc-form-hint">{displayHint}</span>}
      {error && <span className="bc-form-error">{error}</span>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export default Textarea;
