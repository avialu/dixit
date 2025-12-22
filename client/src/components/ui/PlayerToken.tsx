import { ReactNode } from "react";

export type TokenSize = "small" | "medium" | "large";

export interface PlayerTokenProps {
  imageUrl?: string | null;
  playerColor?: string;
  size?: TokenSize;
  editable?: boolean;
  onUpload?: (imageData: string) => void;
  onRemove?: () => void;
  className?: string;
  children?: ReactNode;
}

// Consistent color palette for player tokens
export const PLAYER_TOKEN_COLORS = [
  "#f39c12", // Orange
  "#3498db", // Blue
  "#2ecc71", // Green
  "#e74c3c", // Red
  "#9b59b6", // Purple
  "#1abc9c", // Teal
];

/**
 * Unified PlayerToken Component
 *
 * Displays player avatar with:
 * - Custom uploaded image OR
 * - Colored circle with "+" fallback
 *
 * Sizes: small, medium, large
 * Can be editable (with upload/remove functionality)
 */
export function PlayerToken({
  imageUrl,
  playerColor,
  size = "medium",
  className = "",
  children,
}: PlayerTokenProps) {
  const sizeClass = {
    small: "token-small",
    medium: "token-medium",
    large: "token-large",
  }[size];

  return (
    <div className={`player-token-preview ${sizeClass} ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Player token"
          className="token-image"
        />
      ) : (
        <div
          className="token-color-preview"
          style={{
            background: playerColor || PLAYER_TOKEN_COLORS[0],
          }}
        />
      )}
      {children}
    </div>
  );
}

/**
 * Helper function to get player color by index
 */
export function getPlayerColor(playerIndex: number): string {
  return PLAYER_TOKEN_COLORS[playerIndex % PLAYER_TOKEN_COLORS.length];
}

