import { Badge, getPlayerColor } from "./ui";
import type { TranslateFunction } from "../i18n";

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
  players?: { id: string; name: string; tokenImage?: string | null }[];
  cardOwners?: { cardId: string; playerId: string }[];
  storytellerCardId?: string | null;
  showResults?: boolean;
  scoreDeltas?: { [playerId: string]: number };

  // Translation function (for reveal phase labels)
  t?: TranslateFunction;
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
  t,
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

  const getCardOwner = (cardId: string) => {
    const owner = cardOwners?.find((o) => o.cardId === cardId);
    if (!owner?.playerId) return null;
    const playerIndex =
      players?.findIndex((p) => p.id === owner.playerId) ?? -1;
    const player = players?.find((p) => p.id === owner.playerId);
    if (!player) return null;
    return { ...player, playerIndex };
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

  const getVoters = (cardId: string) => {
    const voterIds =
      votes?.filter((v) => v.cardId === cardId).map((v) => v.voterId) || [];
    return voterIds
      .map((id) => {
        const playerIndex = players?.findIndex((p) => p.id === id) ?? -1;
        const player = players?.find((p) => p.id === id);
        if (!player) return null;
        return { ...player, playerIndex };
      })
      .filter(Boolean) as {
      id: string;
      name: string;
      tokenImage?: string | null;
      playerIndex: number;
    }[];
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
        const voters = showDrawer ? getVoters(cardId) : [];
        const owner = showDrawer ? getCardOwner(cardId) : null;
        const ownerPoints = showDrawer ? getCardOwnerPoints(cardId) : 0;

        return (
          <div
            key={cardId}
            className={`card ${isSelected ? "selected" : ""} ${
              isLocked ? "locked" : ""
            } ${isDisabled ? "disabled" : ""} ${
              isStoryteller && showResults ? "storyteller-card-gold" : ""
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
            {/* Card Owner Header - only during reveal */}
            {showDrawer && showResults && owner && (
              <div
                className={`card-owner-header ${
                  isStoryteller ? "storyteller-gold" : ""
                }`}
              >
                <div className="owner-profile">
                  {owner.tokenImage ? (
                    <img
                      src={owner.tokenImage}
                      alt={owner.name}
                      className="owner-avatar"
                    />
                  ) : (
                    <div
                      className="owner-avatar owner-avatar-fallback"
                      style={{ background: getPlayerColor(owner.playerIndex) }}
                    >
                      {owner.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <span className="owner-name">{owner.name}</span>
                </div>
                {scoreDeltas && (
                  <span
                    className={`owner-points ${
                      ownerPoints > 0
                        ? "positive"
                        : ownerPoints < 0
                        ? "negative"
                        : "zero"
                    }`}
                  >
                    {ownerPoints > 0 ? "+" : ""}
                    {ownerPoints}
                  </span>
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

              {/* My Card Badge (in voting only, not in reveal) */}
              {showDrawer && isMyCard && !showResults && (
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

              {/* Voter Profile Images - overlaid on card during reveal */}
              {showDrawer && showResults && (
                <div className="card-voters-overlay">
                  <span className="voters-title">
                    {voters.length > 0
                      ? t
                        ? t("reveal.votedBy")
                        : "Voted by"
                      : t
                      ? t("reveal.noVotes")
                      : "No votes!"}
                  </span>
                  {voters.length > 0 && (
                    <div className="voters-list">
                      {voters.slice(0, 5).map((voter, idx) => (
                        <div
                          key={idx}
                          className="voter-profile"
                          title={voter.name}
                        >
                          {voter.tokenImage ? (
                            <img
                              src={voter.tokenImage}
                              alt={voter.name}
                              className="voter-img"
                            />
                          ) : (
                            <div
                              className="voter-img voter-img-fallback"
                              style={{
                                background: getPlayerColor(voter.playerIndex),
                              }}
                            >
                              {voter.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {voters.length > 5 && (
                        <div
                          className="voter-profile voter-overflow"
                          title={voters
                            .slice(5)
                            .map((v) => v.name)
                            .join(", ")}
                        >
                          <div className="voter-img voter-img-fallback">
                            +{voters.length - 5}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
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
