import { ButtonHTMLAttributes } from "react";
import { Button } from "./Button";

export interface CloseButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClose: () => void;
  className?: string;
}

/**
 * Unified CloseButton Component
 *
 * Standardized X button for modals and dismissible UI elements.
 * Uses the Button component internally with icon variant.
 * Includes accessibility labels and consistent styling.
 */
export function CloseButton({
  onClose,
  className = "",
  ...props
}: CloseButtonProps) {
  return (
    <Button
      variant="icon"
      className={`x-button modal-close-button ${className}`}
      onClick={onClose}
      aria-label="Close modal"
      title="Close and view board"
      {...props}
    >
      ×
    </Button>
  );
}
