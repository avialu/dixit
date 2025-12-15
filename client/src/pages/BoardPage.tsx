import { RoomState } from '../hooks/useGameState';
import { Scoreboard } from '../components/Scoreboard';
import { BoardView } from '../components/BoardView';

interface BoardPageProps {
  roomState: RoomState | null;
}

export function BoardPage({ roomState }: BoardPageProps) {
  if (!roomState) {
    return <div className="loading">Connecting...</div>;
  }

  const showCards = ['REVEAL', 'VOTING', 'SCORING'].includes(roomState.phase);
  const showVotes = roomState.phase === 'SCORING';

  return (
    <div className="board-page">
      <div className="board-header">
        <h1>🎨 DIXIT</h1>
        <div className="round-info">Round {roomState.currentRound}</div>
      </div>

      <div className="phase-indicator-large">
        {roomState.phase.replace(/_/g, ' ')}
      </div>

      {roomState.currentClue && (
        <div className="clue-display">
          <div className="clue-label">Clue:</div>
          <div className="clue-text">"{roomState.currentClue}"</div>
        </div>
      )}

      {showCards && roomState.revealedCards.length > 0 && (
        <BoardView
          revealedCards={roomState.revealedCards}
          votes={showVotes ? roomState.votes : undefined}
        />
      )}

      {!showCards && (
        <div className="board-waiting">
          {roomState.phase === 'WAITING_FOR_PLAYERS' && (
            <p>Waiting for players to join...</p>
          )}
          {roomState.phase === 'DECK_BUILDING' && (
            <p>Building deck... ({roomState.deckSize}/100 images)</p>
          )}
          {roomState.phase === 'STORYTELLER_CHOICE' && (
            <p>Storyteller is choosing a card...</p>
          )}
          {roomState.phase === 'PLAYERS_CHOICE' && (
            <p>Players are choosing cards...</p>
          )}
          {roomState.phase === 'GAME_END' && (
            <h2>Game Over!</h2>
          )}
        </div>
      )}

      <div className="board-footer">
        <Scoreboard
          players={roomState.players}
          storytellerId={roomState.storytellerId}
          lastScoreDeltas={roomState.lastScoreDeltas}
        />
      </div>
    </div>
  );
}

