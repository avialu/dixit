import { Card } from '../hooks/useGameState';

interface HandViewProps {
  hand: Card[];
  selectedCardId: string | null;
  onSelectCard: (cardId: string) => void;
  disabled?: boolean;
}

export function HandView({ hand, selectedCardId, onSelectCard, disabled }: HandViewProps) {
  return (
    <div className="hand-view">
      <h3>Your Hand ({hand.length} cards)</h3>
      <div className="cards-grid">
        {hand.map((card) => (
          <div
            key={card.id}
            className={`card ${selectedCardId === card.id ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
            onClick={() => !disabled && onSelectCard(card.id)}
          >
            <img src={card.imageData} alt="Card" />
          </div>
        ))}
      </div>
    </div>
  );
}

