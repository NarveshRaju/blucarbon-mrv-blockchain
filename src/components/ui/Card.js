import React from 'react';

/**
 * Reusable Card component with optional header, body, and footer sections.
 *
 * @param {object} props
 * @param {'default'|'outlined'|'hoverable'} [props.variant='default']
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
const Card = ({ variant = 'default', className = '', children, ...rest }) => {
  const classes = [
    'bc-card',
    variant === 'hoverable' ? 'bc-card--hoverable' : '',
    variant === 'outlined' ? 'bc-card--outlined' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
};

/** Card header section */
const CardHeader = ({ className = '', children }) => (
  <div className={`bc-card__header ${className}`}>{children}</div>
);

/** Card body section */
const CardBody = ({ className = '', children }) => (
  <div className={`bc-card__body ${className}`}>{children}</div>
);

/** Card footer section */
const CardFooter = ({ className = '', children }) => (
  <div className={`bc-card__footer ${className}`}>{children}</div>
);

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
