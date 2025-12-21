import { useState, useEffect, useRef } from "react";
import { RoomState } from "../hooks/useGameState";
import { QRCode } from "./QRCode";

interface GameBoardProps {
  roomState: RoomState;
}

export function GameBoard({ roomState }: GameBoardProps) {
  const [animatingScores, setAnimatingScores] = useState<{ [playerId: string]: number }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const lastAnimatedRound = useRef<number>(-1);
  const [isMobile, setIsMobile] = useState(false);
  
  const trackLength = 31; // 0 to 30 = 31 spaces
  
  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Trigger animation when entering SCORING phase
  useEffect(() => {
    if (roomState.phase === "SCORING" && 
        roomState.lastScoreDeltas.length > 0 && 
        lastAnimatedRound.current !== roomState.currentRound) {
      
      lastAnimatedRound.current = roomState.currentRound;
      
      console.log('🎯 Starting scoring animation for round:', roomState.currentRound);
      console.log('Score deltas:', roomState.lastScoreDeltas);
      
      // Calculate previous scores (current - delta)
      const previousScores: { [playerId: string]: number } = {};
      roomState.players.forEach(player => {
        const delta = roomState.lastScoreDeltas.find(d => d.playerId === player.id);
        const prevScore = player.score - (delta?.delta || 0);
        previousScores[player.id] = Math.max(0, prevScore); // Don't go below 0
        console.log(`Player ${player.name}: ${prevScore} → ${player.score} (+${delta?.delta || 0})`);
      });
      
      // Set initial position (before animation)
      setAnimatingScores(previousScores);
      setIsAnimating(true);
      
      // Start animation to final position after a brief delay
      const animateTimer = setTimeout(() => {
        console.log('🚀 Animating to final positions...');
        // Update to final scores to trigger CSS transition
        const finalScores: { [playerId: string]: number } = {};
        roomState.players.forEach(player => {
          finalScores[player.id] = player.score;
        });
        setAnimatingScores(finalScores);
      }, 50);
      
      // End animation state
      const endTimer = setTimeout(() => {
        console.log('✅ Animation complete');
        setIsAnimating(false);
        setAnimatingScores({});
      }, 2500);
      
      return () => {
        clearTimeout(animateTimer);
        clearTimeout(endTimer);
      };
    }
  }, [roomState.phase, roomState.currentRound, roomState.lastScoreDeltas, roomState.players]);

  // Generate path positions in a winding pattern
  const generatePathPositions = (length: number) => {
    const positions: { x: number; y: number; index: number }[] = [];
    // Use fewer columns on mobile for taller, narrower board
    const cols = isMobile ? 5 : 8; // 5 columns on mobile (wider), 8 on desktop
    // Wider spacing
    const xSpacing = isMobile ? 14 : 12;
    const ySpacing = 12;
    const xOffset = isMobile ? 7 : 5;
    const yOffset = 10;

    for (let i = 0; i < length; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;

      // Alternate direction for zigzag pattern
      const actualCol = row % 2 === 0 ? col : cols - 1 - col;

      positions.push({
        x: actualCol * xSpacing + xOffset,
        y: row * ySpacing + yOffset,
        index: i,
      });
    }

    return positions;
  };

  const pathPositions = generatePathPositions(trackLength);
  
  // Calculate viewBox based on mobile/desktop - wider dimensions
  const viewBoxWidth = isMobile ? 80 : 110;
  const viewBoxHeight = isMobile ? 90 : 70;

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

  // Get game status message
  const getGameStatus = () => {
    const storyteller = roomState.players.find(p => p.id === roomState.storytellerId);
    const storytellerName = storyteller?.name || "Storyteller";
    
    switch (roomState.phase) {
      case "DECK_BUILDING":
        return {
          icon: "🎴",
          text: roomState.players.length < 3 
            ? "Waiting for players to join..." 
            : "Building the deck...",
          subtext: `${roomState.players.length} players | ${roomState.deckSize} images`
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

      {/* QR Code during DECK_BUILDING phase */}
      {roomState.phase === "DECK_BUILDING" && (
        <div className="board-qr-code-section">
          <div className="board-qr-code-container">
            <p className="board-qr-hint">Scan to join on mobile</p>
            <QRCode url={roomState.serverUrl} size={180} />
            <p className="board-qr-url">{roomState.serverUrl}</p>
          </div>
        </div>
      )}

      {/* Decorative background */}
      <div className="board-scenic-background">
        <div className="board-sky"></div>
        <div className="board-hills"></div>
      </div>

      {/* Score track */}
      <div className="score-track-container">
        <svg viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} preserveAspectRatio="xMidYMid meet" className="score-track-svg">
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
              </g>
            );
          })}

          {/* Draw player tokens separately for smooth animation */}
          {roomState.players.map((player) => {
            const displayScore = animatingScores[player.id] !== undefined ? animatingScores[player.id] : player.score;
            const position = pathPositions[displayScore] || pathPositions[0];
            
            // Count players at same position for offset
            const playersAtSamePosition = roomState.players.filter(p => {
              const pScore = animatingScores[p.id] !== undefined ? animatingScores[p.id] : p.score;
              return pScore === displayScore;
            });
            const positionIndex = playersAtSamePosition.findIndex(p => p.id === player.id);
            const offsetX = positionIndex * 1.8 - (playersAtSamePosition.length - 1) * 0.9;
            
            const delta = roomState.lastScoreDeltas.find(d => d.playerId === player.id);
            const isMoving = isAnimating && delta && delta.delta !== 0;
            
            return (
              <g key={player.id} className={isAnimating ? 'token-animating' : ''}>
                <circle
                  cx={position.x + offsetX}
                  cy={position.y - 5}
                  r="2.2"
                  fill={getPlayerColor(player.id)}
                  stroke="#fff"
                  strokeWidth="0.3"
                  className="player-token"
                  style={{
                    transition: isAnimating ? 'cx 2s ease-in-out, cy 2s ease-in-out' : 'none'
                  }}
                />
                {roomState.storytellerId === player.id && (
                  <text
                    x={position.x + offsetX}
                    y={position.y - 4.5}
                    fontSize="2"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      transition: isAnimating ? 'x 2s ease-in-out, y 2s ease-in-out' : 'none'
                    }}
                  >
                    📖
                  </text>
                )}
                {isMoving && delta.delta > 0 && (
                  <text
                    x={position.x + offsetX}
                    y={position.y - 11}
                    fontSize="2"
                    fontWeight="bold"
                    textAnchor="middle"
                    fill="#2ecc71"
                    className="score-delta-floating"
                    style={{
                      transition: isAnimating ? 'x 2s ease-in-out, y 2s ease-in-out' : 'none'
                    }}
                  >
                    +{delta.delta}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

    </div>
  );
}
