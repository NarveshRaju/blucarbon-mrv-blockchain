import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Reusable Modal component with overlay, header, body, and footer.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Controls visibility
 * @param {Function} props.onClose - Called when overlay or close button clicked
 * @param {string} [props.title] - Modal header title
 * @param {string} [props.size='md'] - 'md' or 'lg'
 * @param {boolean} [props.closeOnOverlay=true] - Close when clicking overlay
 * @param {React.ReactNode} [props.footer] - Optional footer content
 * @param {React.ReactNode} props.children - Modal body content
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  closeOnOverlay = true,
  footer,
  children,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const modalClasses = [
    'bc-modal',
    size === 'lg' ? 'bc-modal--lg' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className="bc-modal-overlay"
      onClick={closeOnOverlay ? onClose : undefined}
    >
      <div className={modalClasses} onClick={(e) => e.stopPropagation()}>
        {title && (
          <div className="bc-modal__header">
            <h2>{title}</h2>
            <button className="bc-modal__close" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="bc-modal__body">
          {children}
        </div>
        {footer && (
          <div className="bc-modal__footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
