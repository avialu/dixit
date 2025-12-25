import { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, IconSize } from "./Icon";

export type ButtonVariant = "primary" | "secondary" | "continue" | "icon" | "danger" | "success";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
  /** Shows a loading spinner and disables the button */
  loading?: boolean;
  /** Optional text to show while loading (replaces children) */
  loadingText?: string;
}

/**
 * Unified Button Component - Single Source of Truth
 *
 * Variants:
 * - primary: Purple gradient button (default)
 * - secondary: Gray button
 * - continue: Green pulsing button for advancing rounds
 * - icon: Small icon-only button
 * - danger: Red button for destructive actions (kick, delete)
 * - success: Green button for confirmations
 *
 * Sizes:
 * - small: Compact button
 * - medium: Standard size (default)
 * - large: Prominent button
 *
 * Loading:
 * - loading={true}: Shows spinner, disables button, applies .btn-loading class
 * - loadingText: Optional text to show while loading
 */
export function Button({
  variant = "primary",
  size = "medium",
  children,
  className = "",
  disabled,
  loading = false,
  loadingText,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    continue: "btn-continue",
    icon: "btn-icon",
    danger: "btn-danger",
    success: "btn-success",
  }[variant];

  const sizeClass = {
    small: "",
    medium: "",
    large: "btn-large",
  }[size];

  const loadingClass = loading ? "btn-loading" : "";

  const classes = [variantClass, sizeClass, loadingClass, className].filter(Boolean).join(" ");

  // Determine icon size based on button size
  const spinnerSize = size === "large" ? IconSize.large : IconSize.medium;

  return (
    <button 
      className={classes} 
      disabled={disabled || loading} 
      aria-busy={loading}
      {...props}
    >
      {loading ? (
        <>
          <Icon.Loader size={spinnerSize} className="btn-spinner" />
          {loadingText && <span className="btn-loading-text">{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </button>
  );
}



