import { Modal } from "./Modal";
import { Button } from "./ui";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "secondary" | "danger" | "success";
  cancelVariant?: "primary" | "secondary" | "danger";
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmModal - Replacement for window.confirm
 *
 * A reusable confirmation dialog with customizable text and styling.
 * Follows mobile-first design principles with clear CTAs.
 *
 * @example
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   title="Confirm Logout"
 *   message="You have 5 uploaded images. Are you sure?"
 *   confirmText="Logout"
 *   confirmVariant="danger"
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
  confirmVariant = "primary",
  cancelVariant = "secondary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onCancel(); // Close modal after confirm
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      header={<h2>{title}</h2>}
      footer={
        <div className="modal-footer-buttons">
          <Button variant={cancelVariant} onClick={onCancel}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={handleConfirm}>
            {confirmText}
          </Button>
        </div>
      }
    >
      <div className="confirm-modal-content">
        <p>{message}</p>
      </div>
    </Modal>
  );
}
