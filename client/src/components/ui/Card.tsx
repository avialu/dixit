import { HTMLAttributes, ReactNode } from "react";

export type CardVariant = "default" | "player";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  children: ReactNode;
  className?: string;
  isHighlighted?: boolean;
}

/**
 * Unified Card Container Component
 *
 * Generic card/container for consistent padding, shadows, and borders.
 *
 * Variants:
 * - default: Basic card container
 * - player: Player card in lobby (with token preview)
 */
export function Card({
  variant = "default",
  children,
  className = "",
  isHighlighted = false,
  ...props
}: CardProps) {
  const variantClass = {
    default: "card-container",
    player: "player-card",
  }[variant];

  const highlightClass = isHighlighted ? "highlighted" : "";

  const classes = [variantClass, highlightClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}


