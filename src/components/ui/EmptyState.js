import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Reusable empty state placeholder.
 *
 * @param {object} props
 * @param {React.ReactNode} [props.icon] - Icon component
 * @param {string} [props.title='Nothing here yet']
 * @param {string} [props.description]
 * @param {React.ReactNode} [props.action] - Optional action button/link
 * @param {string} [props.className]
 */
const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  description,
  action,
  className = '',
}) => (
  <div className={`bc-empty-state ${className}`}>
    <div className="bc-empty-state__icon">{icon || <Inbox size={36} />}</div>
    <h3 className="bc-empty-state__title">{title}</h3>
    {description && <p className="bc-empty-state__description">{description}</p>}
    {action && <div>{action}</div>}
  </div>
);

export default EmptyState;
