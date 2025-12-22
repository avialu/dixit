import { ButtonHTMLAttributes } from "react";

export interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClose: () => void;
  className?: string;
}

/**
 * Unified CloseButton Component
 *
 * Standardized X button for modals and dismissible UI elements.
 * Includes accessibility labels and consistent styling.
 */
export function CloseButton({
  onClose,
  className = "",
  ...props
}: CloseButtonProps) {
  return (
    <button
      className={`x-button modal-close-button ${className}`}
      onClick={onClose}
      aria-label="Close modal"
      title="Close and view board"
      {...props}
    >
      ×
    </button>
  );
}

