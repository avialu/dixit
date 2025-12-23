import { useState, useCallback } from "react";
import { RoomState, PlayerState } from "../../hooks/useGameState";

/**
 * Custom hook to manage game modal state and logic
 * Extracted from UnifiedGamePage to reduce complexity
 */
export function useGameModals(
  roomState: RoomState | null,
  _playerState: PlayerState | null,
  isStoryteller: boolean,
  isSpectator: boolean
) {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"settings" | "cards">("cards");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clue, setClue] = useState("");
  const [localSubmittedCardId, setLocalSubmittedCardId] = useState<
    string | null
  >(null);
  const [localSubmittedClue, setLocalSubmittedClue] = useState<string>("");
  const [localVotedCardId, setLocalVotedCardId] = useState<string | null>(null);
  const [triggerBoardAnimation, setTriggerBoardAnimation] = useState(false);

  // Auto-open modal for game phases
  const checkAutoOpen = useCallback(() => {
    const phase = roomState?.phase;
    let shouldAutoOpen = false;

    if (phase === "STORYTELLER_CHOICE" && isStoryteller) {
      shouldAutoOpen = true;
    } else if (phase === "PLAYERS_CHOICE" && !isStoryteller && !isSpectator) {
      shouldAutoOpen = true;
    } else if (phase === "VOTING" && !isStoryteller && !isSpectator) {
      shouldAutoOpen = true;
    } else if (phase === "REVEAL") {
      shouldAutoOpen = true;
    } else if (phase === "GAME_END") {
      shouldAutoOpen = true;
    }

    if (shouldAutoOpen) {
      setModalType("cards");
      setShowModal(true);
    }

    // Reset animation trigger when phase changes away from REVEAL
    if (phase !== "REVEAL") {
      setTriggerBoardAnimation(false);
    }
  }, [roomState?.phase, isStoryteller, isSpectator]);

  // Reset local state when phase changes
  const resetLocalState = useCallback(() => {
    const phase = roomState?.phase;

    if (phase !== "STORYTELLER_CHOICE") {
      setLocalSubmittedCardId(null);
      setLocalSubmittedClue("");
    }
    if (phase !== "PLAYERS_CHOICE") {
      setLocalSubmittedCardId(null);
    }
    if (phase !== "VOTING") {
      setLocalVotedCardId(null);
    }
  }, [roomState?.phase]);

  return {
    showModal,
    setShowModal,
    modalType,
    setModalType,
    selectedCardId,
    setSelectedCardId,
    clue,
    setClue,
    localSubmittedCardId,
    setLocalSubmittedCardId,
    localSubmittedClue,
    setLocalSubmittedClue,
    localVotedCardId,
    setLocalVotedCardId,
    triggerBoardAnimation,
    setTriggerBoardAnimation,
    checkAutoOpen,
    resetLocalState,
  };
}
