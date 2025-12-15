interface BoardViewProps {
  revealedCards: { cardId: string; imageData: string; position: number }[];
  votes?: { voterId: string; cardId: string }[];
}

export function BoardView({ revealedCards, votes }: BoardViewProps) {
  const sorted = [...revealedCards].sort((a, b) => a.position - b.position);

  const getVoteCount = (cardId: string) => {
    return votes?.filter(v => v.cardId === cardId).length || 0;
  };

  return (
    <div className="board-view">
      <div className="board-cards">
        {sorted.map((card) => {
          const voteCount = getVoteCount(card.cardId);
          
          return (
            <div key={card.cardId} className="board-card">
              <div className="card-number-large">{card.position + 1}</div>
              <img src={card.imageData} alt={`Card ${card.position + 1}`} />
              {votes && voteCount > 0 && (
                <div className="vote-count-large">
                  {voteCount} vote{voteCount !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

