import { Card } from '../hooks/useGameState';

interface HandViewProps {
  hand: Card[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled?: boolean;
  lockedCardId?: string | null;
}

export function HandView({ hand, selectedCardId, onSelectCard, disabled, lockedCardId }: HandViewProps) {
  return (
    <div className="hand-view">
      <h3>Your Hand ({hand.length} cards)</h3>
      <div className="cards-grid">
        {hand.map((card) => {
          const isLocked = lockedCardId === card.id;
          const isSelected = selectedCardId === card.id;
          
          return (
            <div
              key={card.id}
              className={`card ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => !disabled && !isLocked && onSelectCard(card.id)}
            >
              <img src={card.imageData} alt="Card" />
              {isLocked && (
                <div className="card-lock-indicator">
                  <span className="lock-icon">🔒</span>
                  <span className="lock-text">Submitted</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

