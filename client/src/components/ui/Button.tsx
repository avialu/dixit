import { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "continue" | "icon";
export type ButtonSize = "small" | "medium" | "large";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  className?: string;
}

/**
 * Unified Button Component - Single Source of Truth
 *
 * Variants:
 * - primary: Purple gradient button (default)
 * - secondary: Gray button
 * - continue: Green pulsing button for advancing rounds
 * - icon: Small icon-only button
 *
 * Sizes:
 * - small: Compact button
 * - medium: Standard size (default)
 * - large: Prominent button
 */
export function Button({
  variant = "primary",
  size = "medium",
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    continue: "btn-continue",
    icon: "btn-icon",
  }[variant];

  const sizeClass = {
    small: "",
    medium: "",
    large: "btn-large",
  }[size];

  const classes = [variantClass, sizeClass, className].filter(Boolean).join(" ");

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}

