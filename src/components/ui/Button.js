import React from 'react';

/**
 * Reusable Button component.
 *
 * @param {object} props
 * @param {'primary'|'secondary'|'success'|'danger'|'ghost'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.block=false] - Full-width button
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.loading=false] - Shows loading text
 * @param {string} [props.loadingText='Loading...']
 * @param {string} [props.type='button']
 * @param {React.ReactNode} [props.icon] - Optional leading icon
 * @param {Function} [props.onClick]
 * @param {string} [props.className] - Additional class names
 * @param {React.ReactNode} props.children
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  block = false,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  type = 'button',
  icon,
  onClick,
  className = '',
  children,
  ...rest
}) => {
  const classes = [
    'bc-btn',
    `bc-btn--${variant}`,
    size !== 'md' ? `bc-btn--${size}` : '',
    block ? 'bc-btn--block' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {icon && <span className="bc-btn__icon">{icon}</span>}
      {loading ? loadingText : children}
    </button>
  );
};

export default Button;
