import React from 'react';

/**
 * Reusable Select component with label, hint, and error support.
 *
 * @param {object} props
 * @param {string} [props.label]
 * @param {string} [props.hint]
 * @param {string} [props.error]
 * @param {boolean} [props.required=false]
 * @param {Array<{value: string, label: string}>} [props.options] - Dropdown options
 * @param {string} [props.placeholder] - Placeholder option text
 * @param {string} [props.className]
 * @param {string} [props.id]
 * @param {React.ReactNode} [props.children] - Alternative to options prop
 */
const Select = React.forwardRef(({
  label,
  hint,
  helperText,
  error,
  required = false,
  options,
  placeholder,
  className = '',
  id,
  children,
  ...rest
}, ref) => {
  const selectId = id || (label ? `bc-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  const displayHint = helperText || hint;

  const selectClasses = [
    'bc-select',
    error ? 'bc-select--error' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className="bc-form-group">
      {label && (
        <label
          htmlFor={selectId}
          className={`bc-form-label ${required ? 'bc-form-label--required' : ''}`}
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={selectClasses}
        required={required}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options
          ? options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))
          : children}
      </select>
      {displayHint && !error && <span className="bc-form-hint">{displayHint}</span>}
      {error && <span className="bc-form-error">{error}</span>}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;
