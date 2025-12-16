import { RoomState } from "../hooks/useGameState";

interface GameBoardProps {
  roomState: RoomState;
}

export function GameBoard({ roomState }: GameBoardProps) {
  const maxScore = Math.max(
    ...roomState.players.map((p) => p.score),
    roomState.winTarget || 30
  );
  const trackLength = Math.max(maxScore + 5, 35); // At least 35 spaces

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

  return (
    <div className="game-board-visual">
      {/* Decorative background */}
      <div className="board-scenic-background">
        <div className="board-sky"></div>
        <div className="board-hills"></div>
      </div>

      {/* Score track */}
      <div className="score-track-container">
        <svg viewBox="0 0 100 100" className="score-track-svg">
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
                strokeWidth="0.8"
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
                  r="2.5"
                  className={`path-space ${isWinTarget ? "win-space" : ""}`}
                  fill={isWinTarget ? "#f39c12" : "#e8d4b8"}
                  stroke="#8b6f47"
                  strokeWidth="0.3"
                />

                {/* Score number */}
                <text
                  x={pos.x}
                  y={pos.y + 0.5}
                  className="space-number"
                  fill="#3d2817"
                  fontSize="1.5"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {pos.index}
                </text>

                {/* Player tokens at this position */}
                {playersHere.map((player, playerIndex) => {
                  const offsetX =
                    playerIndex * 1.2 - (playersHere.length - 1) * 0.6;
                  return (
                    <g key={player.id}>
                      <circle
                        cx={pos.x + offsetX}
                        cy={pos.y - 3.5}
                        r="1.5"
                        fill={getPlayerColor(player.id)}
                        stroke="#fff"
                        strokeWidth="0.2"
                        className="player-token"
                      />
                      {roomState.storytellerId === player.id && (
                        <text
                          x={pos.x + offsetX}
                          y={pos.y - 3.2}
                          fontSize="1.5"
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

      {/* Player legend */}
      <div className="player-legend-board">
        {roomState.players.map((player) => (
          <div key={player.id} className="legend-item">
            <div
              className="legend-token"
              style={{ backgroundColor: getPlayerColor(player.id) }}
            ></div>
            <span className="legend-name">{player.name}</span>
            <span className="legend-score">{player.score}</span>
            {roomState.storytellerId === player.id && (
              <span className="legend-storyteller">📖</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
