import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RoomState, PlayerState } from '../hooks/useGameState';
import { HandView } from '../components/HandView';
import { VotingView } from '../components/VotingView';

interface GamePageProps {
  roomState: RoomState | null;
  playerState: PlayerState | null;
  playerId: string;
  onStorytellerSubmit: (cardId: string, clue: string) => void;
  onPlayerSubmitCard: (cardId: string) => void;
  onPlayerVote: (cardId: string) => void;
  onAdvanceRound: () => void;
  onResetGame: () => void;
  onNewDeck: () => void;
}

export function GamePage({
  roomState,
  playerState,
  playerId,
  onStorytellerSubmit,
  onPlayerSubmitCard,
  onPlayerVote,
  onAdvanceRound,
  onResetGame,
  onNewDeck,
}: GamePageProps) {
  const navigate = useNavigate();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [clue, setClue] = useState('');

  useEffect(() => {
    if (!roomState) return;
    
    if (roomState.phase === 'DECK_BUILDING' || roomState.phase === 'WAITING_FOR_PLAYERS') {
      navigate('/lobby');
    } else if (roomState.phase === 'GAME_END') {
      // Stay on game page to show final scores
    }
  }, [roomState?.phase, navigate]);

  if (!roomState || !playerState) {
    return <div className="loading">Loading game...</div>;
  }

  const isStoryteller = roomState.storytellerId === playerId;
  const myPlayer = roomState.players.find(p => p.id === playerId);
  const isAdmin = myPlayer?.isAdmin || false;

  const handleStorytellerSubmit = () => {
    if (selectedCardId && clue.trim()) {
      onStorytellerSubmit(selectedCardId, clue.trim());
      setSelectedCardId(null);
      setClue('');
    }
  };

  const handlePlayerSubmit = () => {
    if (selectedCardId) {
      onPlayerSubmitCard(selectedCardId);
      setSelectedCardId(null);
    }
  };

  const handleVote = () => {
    if (selectedCardId) {
      onPlayerVote(selectedCardId);
      setSelectedCardId(null);
    }
  };

  return (
    <div className="game-page">
      <div className="game-header">
        <h2>Round {roomState.currentRound}</h2>
        <div className="phase-indicator">{roomState.phase.replace(/_/g, ' ')}</div>
        <div className="player-score">
          {myPlayer?.name}: {myPlayer?.score} points
        </div>
      </div>

      {roomState.currentClue && (
        <div className="current-clue">
          <strong>Clue:</strong> "{roomState.currentClue}"
        </div>
      )}

      {/* STORYTELLER_CHOICE */}
      {roomState.phase === 'STORYTELLER_CHOICE' && (
        <>
          {isStoryteller ? (
            <div className="storyteller-section">
              <h3>You are the Storyteller!</h3>
              <p>Choose a card and give a clue</p>
              
              <input
                type="text"
                placeholder="Enter your clue..."
                value={clue}
                onChange={(e) => setClue(e.target.value)}
                maxLength={200}
              />

              <HandView
                hand={playerState.hand}
                selectedCardId={selectedCardId}
                onSelectCard={setSelectedCardId}
              />

              <button
                onClick={handleStorytellerSubmit}
                disabled={!selectedCardId || !clue.trim()}
                className="btn-primary btn-large"
              >
                Submit Card & Clue
              </button>
            </div>
          ) : (
            <div className="waiting">
              <p>Waiting for storyteller to choose...</p>
            </div>
          )}
        </>
      )}

      {/* PLAYERS_CHOICE */}
      {roomState.phase === 'PLAYERS_CHOICE' && (
        <>
          {!isStoryteller ? (
            <div className="player-choice-section">
              <h3>Choose a card that matches the clue</h3>
              
              {!playerState.mySubmittedCardId ? (
                <>
                  <HandView
                    hand={playerState.hand}
                    selectedCardId={selectedCardId}
                    onSelectCard={setSelectedCardId}
                  />

                  <button
                    onClick={handlePlayerSubmit}
                    disabled={!selectedCardId}
                    className="btn-primary btn-large"
                  >
                    Submit Card
                  </button>
                </>
              ) : (
                <p>Card submitted! Waiting for others...</p>
              )}
            </div>
          ) : (
            <div className="waiting">
              <p>Waiting for other players to choose cards...</p>
            </div>
          )}
        </>
      )}

      {/* REVEAL */}
      {roomState.phase === 'REVEAL' && (
        <div className="reveal-section">
          <h3>Revealing Cards...</h3>
          <VotingView
            revealedCards={roomState.revealedCards}
            selectedCardId={null}
            onSelectCard={() => {}}
            disabled={true}
          />
        </div>
      )}

      {/* VOTING */}
      {roomState.phase === 'VOTING' && (
        <>
          {!isStoryteller ? (
            <div className="voting-section">
              <h3>Vote for the Storyteller's Card</h3>
              <p>(You cannot vote for your own card)</p>

              {!playerState.myVote ? (
                <>
                  <VotingView
                    revealedCards={roomState.revealedCards}
                    selectedCardId={selectedCardId}
                    onSelectCard={setSelectedCardId}
                    myCardId={playerState.mySubmittedCardId}
                  />

                  <button
                    onClick={handleVote}
                    disabled={!selectedCardId}
                    className="btn-primary btn-large"
                  >
                    Vote
                  </button>
                </>
              ) : (
                <p>Vote submitted! Waiting for others...</p>
              )}
            </div>
          ) : (
            <div className="waiting">
              <p>Players are voting...</p>
              <VotingView
                revealedCards={roomState.revealedCards}
                selectedCardId={null}
                onSelectCard={() => {}}
                disabled={true}
              />
            </div>
          )}
        </>
      )}

      {/* SCORING */}
      {roomState.phase === 'SCORING' && (
        <div className="scoring-section">
          <h3>Round Results</h3>
          
          <VotingView
            revealedCards={roomState.revealedCards}
            selectedCardId={null}
            onSelectCard={() => {}}
            disabled={true}
            votes={roomState.votes}
          />

          <div className="score-deltas">
            <h4>Score Changes:</h4>
            {roomState.lastScoreDeltas.map((delta) => {
              const player = roomState.players.find(p => p.id === delta.playerId);
              return (
                <div key={delta.playerId} className="score-delta">
                  {player?.name}: {delta.delta > 0 ? '+' : ''}{delta.delta} points
                </div>
              );
            })}
          </div>

          <button onClick={onAdvanceRound} className="btn-primary btn-large">
            Next Round
          </button>
        </div>
      )}

      {/* GAME_END */}
      {roomState.phase === 'GAME_END' && (
        <div className="game-end-section">
          <h2>🏆 Game Over!</h2>
          
          {(() => {
            const sortedPlayers = [...roomState.players].sort((a, b) => b.score - a.score);
            const winner = sortedPlayers[0];
            const wonByTarget = roomState.winTarget !== null && winner.score >= roomState.winTarget;
            
            return (
              <>
                {wonByTarget && (
                  <p className="winner-announcement">
                    {winner.name} wins with {winner.score} points!
                  </p>
                )}
                <div className="final-scores">
                  {sortedPlayers.map((player, index) => (
                    <div key={player.id} className={`final-score ${index === 0 ? 'winner' : ''}`}>
                      <span className="rank">{index + 1}.</span>
                      <span className="name">{player.name}</span>
                      <span className="score">{player.score} points</span>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
          
          <button onClick={() => navigate('/lobby')} className="btn-primary">
            Back to Lobby
          </button>
          
          {isAdmin && (
            <>
              <button onClick={onResetGame} className="btn-secondary">
                Reset Game (Keep Deck)
              </button>
              <button onClick={onNewDeck} className="btn-secondary">
                New Deck
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

