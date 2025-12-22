import { ReactNode } from "react";

export type BadgeVariant = "admin" | "you" | "storyteller" | "score" | "votes";

export interface BadgeProps {
  variant: BadgeVariant;
  value?: string | number;
  className?: string;
  children?: ReactNode;
  style?: React.CSSProperties;
}

/**
 * Unified Badge Component
 *
 * Variants:
 * - admin: Crown icon for admin players
 * - you: "(You)" label for current player
 * - storyteller: Storyteller mask icon
 * - score: Point delta display (+3, etc)
 * - votes: Vote count badge
 */
export function Badge({
  variant,
  value,
  className = "",
  children,
  style,
}: BadgeProps) {
  const variantClass = {
    admin: "admin-badge",
    you: "you-badge",
    storyteller: "storyteller-badge",
    score: "owner-points",
    votes: "vote-count-badge",
  }[variant];

  const defaultContent = {
    admin: "👑",
    you: "(You)",
    storyteller: "🎭",
    score: value !== undefined ? `+${value}` : "+0",
    votes: value !== undefined ? value : "0",
  }[variant];

  return (
    <span
      className={`${variantClass} ${className}`}
      style={style}
      aria-label={variant === "score" ? `Earned ${value} points` : undefined}
    >
      {children || defaultContent}
    </span>
  );
}


