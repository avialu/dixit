import { Button, CloseButton } from "./ui";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger" | "success";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmModal - Replacement for window.confirm
 *
 * A reusable confirmation dialog with customizable text and styling.
 * Follows mobile-first design principles with clear CTAs.
 *
 * Button colors:
 * - Cancel button: Red (danger) - to indicate stopping/canceling the action
 * - Confirm button: Green (success) - to indicate proceeding with the action
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Confirm Logout"
 *   message="You have 5 uploaded images. Are you sure?"
 *   confirmText="Logout"
 *   onConfirm={handleLogout}
 *   onCancel={() => setShowConfirm(false)}
 * />
 */
export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "success",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close modal after confirm
  };

  if (!isOpen) return null;

  // Use custom high-z-index container for nested modal support
  return (
    <>
      {/* High z-index backdrop */}
      <div
        className="confirm-modal-backdrop"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* High z-index modal popup */}
      <div
        className="confirm-modal-popup"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <CloseButton onClose={onCancel} />

        {/* Header */}
        <div className="confirm-modal-header">
          <h2>{title}</h2>
        </div>

        {/* Content */}
        <div className="confirm-modal-content">
          <p>{message}</p>
        </div>

        {/* Footer with buttons */}
        <div className="confirm-modal-footer">
          <Button variant="danger" onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </>
  );
}
