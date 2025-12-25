import { Badge } from "./ui";

interface CardViewProps {
  cards: Array<{
    id?: string;
    cardId?: string;
    imageData: string;
    position?: number;
  }>;
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled?: boolean;
  lockedCardId?: string | null;

  // Drawer/Metadata props (for voting/reveal phases)
  showDrawer?: boolean;
  myCardId?: string | null;
  votes?: { voterId: string; cardId: string }[];
  players?: { id: string; name: string }[];
  cardOwners?: { cardId: string; playerId: string }[];
  storytellerCardId?: string | null;
  showResults?: boolean;
  scoreDeltas?: { [playerId: string]: number };
}

/**
 * Unified Card View Component
 *
 * Can display:
 * 1. Hand view (showDrawer=false) - Just cards
 * 2. Voting view (showDrawer=true) - Cards with owner/vote info
 */
export function CardView({
  cards,
  selectedCardId,
  onSelectCard,
  disabled = false,
  lockedCardId,
  showDrawer = false,
  myCardId,
  votes,
  players,
  cardOwners,
  storytellerCardId,
  showResults = false,
  scoreDeltas,
}: CardViewProps) {
  // Sort by position if available (for voting/reveal)
  const sortedCards = cards.slice().sort((a, b) => {
    if (a.position !== undefined && b.position !== undefined) {
      return a.position - b.position;
    }
    return 0;
  });

  const getVoteCount = (cardId: string) => {
    return votes?.filter((v) => v.cardId === cardId).length || 0;
  };

  const getCardOwnerName = (cardId: string) => {
    const owner = cardOwners?.find((o) => o.cardId === cardId);
    if (!owner?.playerId) return "Unknown";
    const player = players?.find((p) => p.id === owner.playerId);
    return player?.name || "Unknown";
  };

  const getCardOwnerPoints = (cardId: string) => {
    if (scoreDeltas) {
      const owner = cardOwners?.find((o) => o.cardId === cardId);
      if (owner?.playerId) {
        return scoreDeltas[owner.playerId] || 0;
      }
    }
    return 0;
  };

  const getVoterNames = (cardId: string) => {
    const voters = votes?.filter((v) => v.cardId === cardId) || [];
    return voters.map((v) => {
      const player = players?.find((p) => p.id === v.voterId);
      return player?.name || "Unknown";
    });
  };

  const isStorytellerCard = (cardId: string) => cardId === storytellerCardId;

  return (
    <div
      className="cards-grid"
      role="list"
      aria-label={showDrawer ? "Cards to vote on" : "Your card hand"}
    >
      {sortedCards.map((card) => {
        // Support both 'id' and 'cardId' properties
        const cardId = card.id || card.cardId || "";

        const isLocked = lockedCardId === cardId;
        const isSelected = selectedCardId === cardId;
        const isMyCard = myCardId === cardId;
        const isStoryteller = showDrawer && isStorytellerCard(cardId);
        const isDisabled = disabled || (showDrawer && isMyCard);

        const voteCount = showDrawer ? getVoteCount(cardId) : 0;
        const voterNames = showDrawer ? getVoterNames(cardId) : [];
        const ownerName = showDrawer ? getCardOwnerName(cardId) : "";
        const ownerPoints = showDrawer ? getCardOwnerPoints(cardId) : 0;

        return (
          <div
            key={cardId}
            className={`card ${isSelected ? "selected" : ""} ${
              isLocked ? "locked" : ""
            } ${isDisabled ? "disabled" : ""} ${
              isStoryteller ? "storyteller-card" : ""
            }`}
            onClick={() => !isDisabled && !isLocked && onSelectCard(cardId)}
            role="listitem"
            aria-label={`Card ${isMyCard ? "(your card)" : ""}${
              isStoryteller ? " (storyteller)" : ""
            }`}
            aria-pressed={isSelected}
            aria-disabled={isDisabled}
            tabIndex={isDisabled || isLocked ? -1 : 0}
            onKeyDown={(e) => {
              if (
                !isDisabled &&
                !isLocked &&
                (e.key === "Enter" || e.key === " ")
              ) {
                e.preventDefault();
                onSelectCard(cardId);
              }
            }}
          >
            {/* Card Drawer/Header (only in voting/reveal phases) */}
            {showDrawer && showResults && (
              <div className="card-header">
                {/* Card owner */}
                <div className="card-owner">
                  {isStoryteller && <Badge variant="storyteller" />}
                  {ownerName}
                  {scoreDeltas && (
                    <Badge
                      variant="score"
                      value={ownerPoints}
                      style={{
                        background:
                          ownerPoints > 0
                            ? "rgba(46, 204, 113, 0.9)"
                            : "rgba(149, 165, 166, 0.5)",
                        color: "white",
                      }}
                    />
                  )}
                </div>

                {/* Voters list */}
                {voterNames.length > 0 && (
                  <div className="card-voters-top">
                    <div className="voters-label">Voted by:</div>
                    <div className="voters-list">
                      {voterNames.length === 1 ? (
                        // Show single voter name
                        <span className="voter-name">{voterNames[0]}</span>
                      ) : voterNames.length <= 3 ? (
                        // Show first voter + "+N more" for 2-3 voters
                        <>
                          <span className="voter-name">{voterNames[0]}</span>
                          <span className="voter-count">
                            {" "}
                            +{voterNames.length - 1} more
                          </span>
                        </>
                      ) : (
                        // Show just count for 4+ voters (avoid overflow)
                        <span className="voter-count">
                          {voterNames.length} votes
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* No votes message */}
                {voterNames.length === 0 && (
                  <div className="card-voters-top no-votes">
                    <div className="voters-label">No votes</div>
                  </div>
                )}
              </div>
            )}

            {/* Card Image */}
            <div className="card-image-container">
              <img
                src={card.imageData}
                alt={`Card ${
                  card.position !== undefined ? card.position + 1 : ""
                }`}
                loading="lazy"
                decoding="async"
              />

              {/* My Card Badge (in voting) */}
              {showDrawer && isMyCard && (
                <div className="my-card-badge" aria-hidden="true">
                  Your Card
                </div>
              )}

              {/* Lock Indicator (submitted/voted) */}
              {isLocked && (
                <div className="card-lock-indicator" aria-hidden="true">
                  <span className="lock-icon">🔒</span>
                  <span className="lock-text">
                    {showDrawer ? "Your Vote" : "Submitted"}
                  </span>
                </div>
              )}
            </div>

            {/* Vote Count Badge (during voting, before reveal) */}
            {showDrawer && !showResults && votes && voteCount > 0 && (
              <Badge variant="votes" value={voteCount} />
            )}
          </div>
        );
      })}
    </div>
  );
}
