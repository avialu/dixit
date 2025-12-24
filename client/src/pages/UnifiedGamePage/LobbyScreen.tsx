import { RoomState } from "../../hooks/useGameState";

interface LobbyScreenProps {
  roomState: RoomState;
  playerId: string;
  isSpectator: boolean;
  isAdmin: boolean;
  editingPlayerId: string | null;
  newName: string;
  setEditingPlayerId: (id: string | null) => void;
  setNewName: (name: string) => void;
  handleStartEditName: (playerId: string, currentName: string) => void;
  handleSaveName: () => void;
  handleCancelEditName: () => void;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetAllowPlayerUploads: (allow: boolean) => void;
  onSetBoardBackground: (imageData: string | null) => void;
  onSetBoardPattern: (pattern: "snake" | "spiral") => void;
  onSetWinTarget: (target: number) => void;
  onUploadTokenImage: (imageData: string | null) => void;
  handleLogout: () => void;
  onKickPlayer: (targetPlayerId: string) => void;
  onPromotePlayer: (targetPlayerId: string) => void;
}

export function LobbyScreen(_props: LobbyScreenProps) {
  // This component would render the full lobby UI
  // For now, returning null as this is a placeholder for the refactor
  // The actual implementation would be extracted from UnifiedGamePage
  return null;
}
