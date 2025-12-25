import { RoomState, PlayerState } from "../../hooks/useGameState";

interface GameScreenProps {
  roomState: RoomState;
  playerState: PlayerState | null;
  playerId: string;
  isStoryteller: boolean;
  isSpectator: boolean;
  showQR: boolean;
  onCloseQR: () => void;
}

export function GameScreen(_props: GameScreenProps) {
  // This component would render the game board and manage modal state
  // For now, returning null as this is a placeholder for the refactor
  // The actual implementation would be extracted from UnifiedGamePage
  return null;
}
