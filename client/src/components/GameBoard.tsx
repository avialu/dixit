import { RoomState } from "../hooks/useGameState";

interface GameBoardProps {
  roomState: RoomState;
}

export function GameBoard({ roomState }: GameBoardProps) {
  const trackLength = 31; // 0 to 30 = 31 spaces

  // Generate path positions in a winding pattern
  const generatePathPositions = (length: number) => {
    const positions: { x: number; y: number; index: number }[] = [];
    const cols = 8;

    for (let i = 0; i < length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Alternate direction for zigzag pattern
      const actualCol = row % 2 === 0 ? col : cols - 1 - col;

      positions.push({
        x: actualCol * 12 + 5,
        y: row * 12 + 10,
        index: i,
      });
    }

    return positions;
  };

  const pathPositions = generatePathPositions(trackLength);

  // Get player color
  const getPlayerColor = (playerId: string) => {
    const colors = [
      "#f39c12",
      "#3498db",
      "#2ecc71",
      "#e74c3c",
      "#9b59b6",
      "#1abc9c",
    ];
    const index = roomState.players.findIndex((p) => p.id === playerId);
    return colors[index % colors.length];
  };

  // Get players at each position
  const getPlayersAtPosition = (score: number) => {
    return roomState.players.filter((p) => p.score === score);
  };

  // Get game status message
  const getGameStatus = () => {
    const storyteller = roomState.players.find(p => p.id === roomState.storytellerId);
    const storytellerName = storyteller?.name || "Storyteller";
    
    switch (roomState.phase) {
      case "WAITING_FOR_PLAYERS":
        return {
          icon: "👥",
          text: "Waiting for players to join...",
          subtext: `${roomState.players.length} players connected`
        };
      case "DECK_BUILDING":
        return {
          icon: "🎴",
          text: "Building the deck...",
          subtext: `${roomState.deckSize} images uploaded`
        };
      case "STORYTELLER_CHOICE":
        return {
          icon: "🎭",
          text: `${storytellerName} is choosing a card...`,
          subtext: "Waiting for storyteller to provide a clue"
        };
      case "PLAYERS_CHOICE":
        return {
          icon: "✍️",
          text: "Players are choosing their cards...",
          subtext: `Match the clue: "${roomState.currentClue}"`
        };
      case "REVEAL":
        return {
          icon: "🎊",
          text: "Cards revealed!",
          subtext: "Get ready to vote"
        };
      case "VOTING":
        return {
          icon: "🗳️",
          text: "Players are voting...",
          subtext: "Which card belongs to the storyteller?"
        };
      case "SCORING":
        return {
          icon: "🏆",
          text: "Round complete!",
          subtext: "Calculating scores..."
        };
      case "GAME_END":
        const winner = [...roomState.players].sort((a, b) => b.score - a.score)[0];
        return {
          icon: "👑",
          text: `${winner.name} wins!`,
          subtext: `Final score: ${winner.score} points`
        };
      default:
        return {
          icon: "🎨",
          text: "Dixit",
          subtext: ""
        };
    }
  };

  const gameStatus = getGameStatus();

  return (
    <div className="game-board-visual">
      {/* Game Status Bar */}
      <div className="game-status-bar">
        <div className="status-icon">{gameStatus.icon}</div>
        <div className="status-content">
          <div className="status-text">{gameStatus.text}</div>
          {gameStatus.subtext && <div className="status-subtext">{gameStatus.subtext}</div>}
        </div>
      </div>

      {/* Decorative background */}
      <div className="board-scenic-background">
        <div className="board-sky"></div>
        <div className="board-hills"></div>
      </div>

      {/* Score track */}
      <div className="score-track-container">
        <svg viewBox="0 0 110 70" preserveAspectRatio="xMidYMid meet" className="score-track-svg">
          {/* Draw path connections */}
          {pathPositions.slice(0, -1).map((pos, i) => {
            const nextPos = pathPositions[i + 1];
            return (
              <line
                key={`line-${i}`}
                x1={pos.x}
                y1={pos.y}
                x2={nextPos.x}
                y2={nextPos.y}
                className="path-line"
                stroke="#d4a574"
                strokeWidth="1.5"
              />
            );
          })}

          {/* Draw spaces */}
          {pathPositions.map((pos) => {
            const isWinTarget = roomState.winTarget === pos.index;
            const playersHere = getPlayersAtPosition(pos.index);

            return (
              <g key={`space-${pos.index}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="3.5"
                  className={`path-space ${isWinTarget ? "win-space" : ""}`}
                  fill={isWinTarget ? "#f39c12" : "#e8d4b8"}
                  stroke="#8b6f47"
                  strokeWidth="0.4"
                />

                {/* Score number */}
                <text
                  x={pos.x}
                  y={pos.y + 0.6}
                  className="space-number"
                  fill="#3d2817"
                  fontSize="2.2"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {pos.index}
                </text>

                {/* Player tokens at this position */}
                {playersHere.map((player, playerIndex) => {
                  const offsetX =
                    playerIndex * 1.8 - (playersHere.length - 1) * 0.9;
                  return (
                    <g key={player.id}>
                      <circle
                        cx={pos.x + offsetX}
                        cy={pos.y - 5}
                        r="2.2"
                        fill={getPlayerColor(player.id)}
                        stroke="#fff"
                        strokeWidth="0.3"
                        className="player-token"
                      />
                      {roomState.storytellerId === player.id && (
                        <text
                          x={pos.x + offsetX}
                          y={pos.y - 4.5}
                          fontSize="2"
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          📖
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}
