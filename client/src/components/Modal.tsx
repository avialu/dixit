import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  showCloseButton?: boolean;
  opaqueBackdrop?: boolean;
}

/**
 * Unified Mobile-First Modal Component
 *
 * Structure:
 * - Fixed header (never shrinks)
 * - Flexible content area (scrolls if needed)
 * - Fixed footer (never shrinks)
 *
 * The modal always maintains the same size, adapting to mobile/desktop.
 */
export function Modal({
  isOpen,
  onClose,
  header,
  children,
  footer,
  showCloseButton = true,
  opaqueBackdrop = false,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`modal-backdrop ${opaqueBackdrop ? "opaque" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div
        className="modal-popup"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        {showCloseButton && (
          <button
            className="modal-close-button"
            onClick={onClose}
            aria-label="Close modal"
            title="Close and view board"
          >
            ✕
          </button>
        )}

        {/* Content Container */}
        <div className="modal-content">
          {/* Header Section - Fixed Height */}
          {header && <div className="modal-header">{header}</div>}

          {/* Content Section - Flexible, Scrollable */}
          <div className="modal-body">{children}</div>

          {/* Footer Section - Fixed Height */}
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </>
  );
}
