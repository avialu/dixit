interface VotingViewProps {
  revealedCards: { cardId: string; imageData: string; position: number }[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled?: boolean;
  votes?: { voterId: string; cardId: string }[];
  myCardId?: string | null;
}

export function VotingView({
  revealedCards,
  selectedCardId,
  onSelectCard,
  disabled,
  votes,
  myCardId,
}: VotingViewProps) {
  // Sort by position
  const sorted = [...revealedCards].sort((a, b) => a.position - b.position);

  const getVoteCount = (cardId: string) => {
    return votes?.filter(v => v.cardId === cardId).length || 0;
  };

  return (
    <div className="voting-view">
      <h3>Submitted Cards</h3>
      <div className="cards-grid">
        {sorted.map((card) => {
          const isMyCard = card.cardId === myCardId;
          const voteCount = getVoteCount(card.cardId);
          
          return (
            <div
              key={card.cardId}
              className={`card ${selectedCardId === card.cardId ? 'selected' : ''} ${disabled || isMyCard ? 'disabled' : ''}`}
              onClick={() => !disabled && !isMyCard && onSelectCard(card.cardId)}
            >
              <div className="card-number">{card.position + 1}</div>
              <img src={card.imageData} alt={`Card ${card.position + 1}`} />
              {votes && voteCount > 0 && (
                <div className="vote-count">{voteCount} vote{voteCount !== 1 ? 's' : ''}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

