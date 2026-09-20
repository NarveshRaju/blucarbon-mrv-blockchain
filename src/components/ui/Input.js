import React from 'react';

/**
 * Reusable Input component with label, hint, and error support.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.hint] - Help text below input
 * @param {string} [props.error] - Error message (also sets error styling)
 * @param {boolean} [props.required=false]
 * @param {string} [props.className]
 * @param {string} [props.id]
 * @param {React.Ref} ref
 * All other props are spread onto the <input> element.
 */
const Input = React.forwardRef(({
  label,
  hint,
  helperText,
  error,
  required = false,
  className = '',
  id,
  ...rest
}, ref) => {
  const inputId = id || (label ? `bc-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const displayHint = helperText || hint;

  const inputClasses = [
    'bc-input',
    error ? 'bc-input--error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="bc-form-group">
      {label && (
        <label
          htmlFor={inputId}
          className={`bc-form-label ${required ? 'bc-form-label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={inputClasses}
        required={required}
        {...rest}
      />
      {displayHint && !error && <span className="bc-form-hint">{displayHint}</span>}
      {error && <span className="bc-form-error">{error}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
