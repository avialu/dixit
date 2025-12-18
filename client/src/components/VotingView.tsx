interface VotingViewProps {
  revealedCards: { cardId: string; imageData: string; position: number }[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled?: boolean;
  votes?: { voterId: string; cardId: string }[];
  myCardId?: string | null;
  players?: { id: string; name: string }[];
  cardOwners?: { cardId: string; playerId: string }[]; // Who submitted each card
  storytellerCardId?: string | null; // Which card belongs to storyteller
  showResults?: boolean; // Show who submitted and who voted after all votes are in
}

export function VotingView({
  revealedCards,
  selectedCardId,
  onSelectCard,
  disabled,
  votes,
  myCardId,
  players,
  cardOwners,
  storytellerCardId,
  showResults,
}: VotingViewProps) {
  // Sort by position
  const sorted = [...revealedCards].sort((a, b) => a.position - b.position);

  const getVoteCount = (cardId: string) => {
    return votes?.filter(v => v.cardId === cardId).length || 0;
  };

  const getCardOwnerName = (cardId: string) => {
    const owner = cardOwners?.find(o => o.cardId === cardId);
    const player = players?.find(p => p.id === owner?.playerId);
    return player?.name || "Unknown";
  };

  const getCardOwnerPoints = (cardId: string) => {
    const isStoryteller = isStorytellerCard(cardId);
    const voteCount = getVoteCount(cardId);
    
    if (isStoryteller) {
      // Storyteller scoring is complex, just show vote count
      return voteCount > 0 ? voteCount : 0;
    } else {
      // Non-storytellers get +1 per vote
      return voteCount;
    }
  };

  const getVoterNames = (cardId: string) => {
    const voters = votes?.filter(v => v.cardId === cardId) || [];
    return voters.map(v => {
      const player = players?.find(p => p.id === v.voterId);
      return player?.name || "Unknown";
    });
  };

  const isStorytellerCard = (cardId: string) => cardId === storytellerCardId;

  return (
    <div className="voting-view">
      <div className="cards-grid">
        {sorted.map((card) => {
          const isMyCard = card.cardId === myCardId;
          const voteCount = getVoteCount(card.cardId);
          const voterNames = getVoterNames(card.cardId);
          const ownerName = getCardOwnerName(card.cardId);
          const isStoryteller = isStorytellerCard(card.cardId);
          const ownerPoints = getCardOwnerPoints(card.cardId);
          
          return (
            <div
              key={card.cardId}
              className={`voting-card ${selectedCardId === card.cardId ? 'selected' : ''} ${disabled || isMyCard ? 'disabled' : ''} ${isStoryteller ? 'storyteller-card' : ''}`}
              onClick={() => !disabled && !isMyCard && onSelectCard(card.cardId)}
            >
              {/* Card info at top (shown after all votes) */}
              {showResults && (
                <div className="card-header">
                  {/* Card owner */}
                  <div className="card-owner">
                    {isStoryteller && <span className="storyteller-badge">🎭 </span>}
                    {ownerName}
                    {ownerPoints > 0 && (
                      <span className="owner-points">+{ownerPoints}</span>
                    )}
                  </div>
                  
                  {/* Voters list */}
                  {voterNames.length > 0 && (
                    <div className="card-voters-top">
                      <div className="voters-label">Voted by:</div>
                      <div className="voters-list">
                        {voterNames.map((name, idx) => (
                          <span key={idx} className="voter-name">
                            {name}
                            {idx < voterNames.length - 1 && ", "}
                          </span>
                        ))}
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

              {/* Card image */}
              <div className="card-image-container">
                <img src={card.imageData} alt={`Card ${card.position + 1}`} />
                {isMyCard && <div className="my-card-badge">Your Card</div>}
              </div>

              {/* Vote count during voting */}
              {!showResults && votes && voteCount > 0 && (
                <div className="vote-count-badge">{voteCount}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

