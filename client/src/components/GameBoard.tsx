import { useState, useEffect, useRef } from "react";
import { RoomState } from "../hooks/useGameState";
import { QRCode } from "./QRCode";
import { CloseButton } from "./ui";
import { getMinimumDeckSize } from "../utils/imageConstants";

interface GameBoardProps {
  roomState: RoomState;
  triggerAnimation?: boolean; // External trigger for animation
  showQR?: boolean;
  onCloseQR?: () => void;
}

export function GameBoard({
  roomState,
  triggerAnimation = false,
  showQR = true,
  onCloseQR,
}: GameBoardProps) {
  const [animatingScores, setAnimatingScores] = useState<{
    [playerId: string]: number;
  }>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const lastAnimatedRound = useRef<number>(-1);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });

  // Dynamic track length based on win target (e.g., winTarget=30 → trackLength=31 for positions 0-30)
  const winTarget = roomState.winTarget || 30;
  const trackLength = winTarget + 1; // Add 1 to include position 0

  // Measure container on mount and after a brief delay (for layout settle)
  useEffect(() => {
    const measureContainer = () => {
      if (svgContainerRef.current) {
        const rect = svgContainerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    measureContainer();
    // Measure again after layout settles
    const timeout = setTimeout(measureContainer, 100);

    window.addEventListener("resize", measureContainer);

    return () => {
      window.removeEventListener("resize", measureContainer);
      clearTimeout(timeout);
    };
  }, []);

  // Trigger animation only when triggerAnimation prop is explicitly set to true
  useEffect(() => {
    if (
      roomState.phase === "REVEAL" &&
      roomState.lastScoreDeltas.length > 0 &&
      lastAnimatedRound.current !== roomState.currentRound &&
      triggerAnimation // Only animate when explicitly triggered (modal closed)
    ) {
      lastAnimatedRound.current = roomState.currentRound;

      // Calculate previous scores (current - delta)
      const previousScores: { [playerId: string]: number } = {};
      roomState.players.forEach((player) => {
        const delta = roomState.lastScoreDeltas.find(
          (d) => d.playerId === player.id
        );
        const prevScore = player.score - (delta?.delta || 0);
        previousScores[player.id] = Math.max(0, prevScore); // Don't go below 0
      });

      // Set initial position (before animation)
      setAnimatingScores(previousScores);
      setIsAnimating(false); // Start with no animation

      // Start animation to final position after a brief delay to ensure DOM update
      const animateTimer = setTimeout(() => {
        setIsAnimating(true); // Enable animation
        // Update to final scores to trigger CSS transition
        const finalScores: { [playerId: string]: number } = {};
        roomState.players.forEach((player) => {
          finalScores[player.id] = player.score;
        });
        setAnimatingScores(finalScores);
      }, 100); // Increased delay for DOM to settle

      // End animation state
      const endTimer = setTimeout(() => {
        setIsAnimating(false);
        setAnimatingScores({});
      }, 2200); // 2s animation + 200ms buffer

      return () => {
        clearTimeout(animateTimer);
        clearTimeout(endTimer);
      };
    }
  }, [
    roomState.phase,
    roomState.currentRound,
    roomState.lastScoreDeltas,
    roomState.players,
    triggerAnimation,
  ]);

  // Calculate viewBox dynamically to match container aspect ratio exactly
  const aspectRatio =
    containerDimensions.width / (containerDimensions.height || 1);

  // Use a base unit and scale viewBox to match container aspect ratio
  const baseHeight = 100;
  const viewBoxHeight = baseHeight;
  const viewBoxWidth = baseHeight * aspectRatio;

  // Calculate scale factor for responsive sizing
  const scaleFactor = Math.min(viewBoxWidth, viewBoxHeight) / 100;

  // Generate path positions - either snake (zigzag) or spiral (snail)
  const generateSnakePattern = (
    length: number,
    cols: number,
    margin: number,
    topMargin: number
  ) => {
    const positions: { x: number; y: number; index: number }[] = [];
    const xSpacing = (viewBoxWidth - margin * 2) / (cols - 1);
    const rows = Math.ceil(length / cols);
    const ySpacing = (viewBoxHeight - topMargin - margin) / (rows - 1);
    const xOffset = margin;
    const yOffset = topMargin;

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

  const generateSpiralPattern = (
    length: number,
    cols: number,
    margin: number,
    topMargin: number
  ) => {
    const positions: { x: number; y: number; index: number }[] = [];
    const xSpacing = (viewBoxWidth - margin * 2) / (cols - 1);
    const rows = Math.ceil(length / cols);
    const ySpacing = (viewBoxHeight - topMargin - margin) / (rows - 1);
    const xOffset = margin;
    const yOffset = topMargin;

    // Create a grid to track visited positions
    const grid: boolean[][] = Array(rows)
      .fill(null)
      .map(() => Array(cols).fill(false));

    let x = 0,
      y = 0;
    let dx = 1,
      dy = 0; // Start moving right

    for (let i = 0; i < length; i++) {
      positions.push({
        x: x * xSpacing + xOffset,
        y: y * ySpacing + yOffset,
        index: i,
      });

      grid[y][x] = true;

      // Don't move after the last position
      if (i === length - 1) break;

      // Try to continue in current direction
      let nextX = x + dx;
      let nextY = y + dy;

      // Check if we need to turn (hit boundary or visited cell)
      if (
        nextX < 0 ||
        nextX >= cols ||
        nextY < 0 ||
        nextY >= rows ||
        grid[nextY]?.[nextX]
      ) {
        // Turn clockwise and keep trying until we find a valid direction
        let attempts = 0;
        while (attempts < 4) {
          // Turn clockwise: right -> down -> left -> up -> right
          if (dx === 1 && dy === 0) {
            dx = 0;
            dy = 1; // Turn down
          } else if (dx === 0 && dy === 1) {
            dx = -1;
            dy = 0; // Turn left
          } else if (dx === -1 && dy === 0) {
            dx = 0;
            dy = -1; // Turn up
          } else if (dx === 0 && dy === -1) {
            dx = 1;
            dy = 0; // Turn right
          }

          // Check if this new direction is valid
          nextX = x + dx;
          nextY = y + dy;

          if (
            nextX >= 0 &&
            nextX < cols &&
            nextY >= 0 &&
            nextY < rows &&
            !grid[nextY]?.[nextX]
          ) {
            // Valid direction found
            break;
          }

          attempts++;
        }

        // If we tried all 4 directions and none are valid, we're stuck
        // This shouldn't happen in a proper spiral, but handle it gracefully
        if (attempts >= 4) {
          console.warn("Spiral pattern stuck at position", { x, y, i, length });
          break;
        }
      }

      x += dx;
      y += dy;
    }

    return positions;
  };

  const generatePathPositions = (length: number) => {
    // For spiral: Create tighter, more loop-oriented grids
    // Aim for more square-like grids to maximize loops
    let cols;

    if (roomState.boardPattern === "spiral") {
      // Spiral: Create more compact, square-like grids for more loops
      const sqrt = Math.sqrt(length);
      const baseCols = Math.ceil(sqrt);

      // Adjust based on aspect ratio but stay closer to square
      if (aspectRatio > 1.5) {
        cols = Math.ceil(baseCols * 1.2); // Slightly wider for landscape
      } else if (aspectRatio < 0.7) {
        cols = Math.max(4, Math.floor(baseCols * 0.8)); // Slightly narrower for portrait
      } else {
        cols = baseCols; // Keep square
      }
    } else {
      // Snake: Use existing logic for zigzag pattern
      if (length <= 11) {
        cols = aspectRatio > 1.4 ? 5 : 4;
      } else if (length <= 21) {
        cols = aspectRatio > 1.8 ? 7 : aspectRatio > 1.4 ? 6 : 5;
      } else {
        if (aspectRatio > 1.8) {
          cols = 9;
        } else if (aspectRatio > 1.4) {
          cols = 7;
        } else if (aspectRatio > 1) {
          cols = 6;
        } else if (aspectRatio > 0.7) {
          cols = 5;
        } else {
          cols = 4;
        }
      }
    }

    // Calculate spacing with comfortable padding from all sides
    const margin = 8 * scaleFactor; // Comfortable padding from edges
    const topMargin = 10 * scaleFactor; // Extra padding from top

    // Generate pattern based on roomState.boardPattern
    if (roomState.boardPattern === "spiral") {
      return generateSpiralPattern(length, cols, margin, topMargin);
    } else {
      // Default to snake pattern
      return generateSnakePattern(length, cols, margin, topMargin);
    }
  };

  const pathPositions = generatePathPositions(trackLength);

  // Calculate dynamic token size based on minimum spacing
  // This ensures tokens fit perfectly on any device
  const calculateTokenSize = () => {
    if (pathPositions.length < 2) return 3.5; // Default for single token

    // Find minimum distance between any two positions
    let minDistance = Infinity;
    for (let i = 0; i < pathPositions.length - 1; i++) {
      const pos1 = pathPositions[i];
      const pos2 = pathPositions[i + 1];
      const distance = Math.sqrt(
        Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
      );
      minDistance = Math.min(minDistance, distance);
    }

    // Token should be 35% of minimum spacing (slightly bigger than before)
    // Clamped between 2.5 and 5.5 units for readability
    const calculatedSize = minDistance * 0.35;
    return Math.max(2.5, Math.min(5.5, calculatedSize));
  };

  const tokenSize = calculateTokenSize();

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
    const storyteller = roomState.players.find(
      (p) => p.id === roomState.storytellerId
    );
    const storytellerName = storyteller?.name || "Storyteller";

    switch (roomState.phase) {
      case "DECK_BUILDING": {
        const minRequired = getMinimumDeckSize(
          roomState.players.length,
          roomState.winTarget
        );
        const needMore = minRequired - roomState.deckSize;
        return {
          icon: "🎴",
          text:
            roomState.players.length < 3
              ? "Waiting for players to join..."
              : needMore > 0
              ? `Need ${needMore} more images to start`
              : "Ready to start!",
          subtext: `${roomState.players.length} players | ${roomState.deckSize}/${minRequired} images`,
        };
      }
      case "STORYTELLER_CHOICE":
        return {
          icon: "🎭",
          text: `${storytellerName} is choosing a card...`,
          subtext: "Waiting for storyteller to provide a clue",
        };
      case "PLAYERS_CHOICE":
        return {
          icon: "✍️",
          text: "Players are choosing their cards...",
          subtext: `Match the clue: "${roomState.currentClue}"`,
        };
      case "REVEAL":
        return {
          icon: "🎊",
          text: "Cards revealed!",
          subtext: "Get ready to vote",
        };
      case "VOTING":
        return {
          icon: "🗳️",
          text: "Players are voting...",
          subtext: "Which card belongs to the storyteller?",
        };
      case "SCORING":
        return {
          icon: "🏆",
          text: "Round complete!",
          subtext: "Calculating scores...",
        };
      case "GAME_END":
        const winner = [...roomState.players].sort(
          (a, b) => b.score - a.score
        )[0];
        return {
          icon: "👑",
          text: `${winner.name} wins!`,
          subtext: `Final score: ${winner.score} points`,
        };
      default:
        return {
          icon: "🎨",
          text: "Dixit",
          subtext: "",
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
          {gameStatus.subtext && (
            <div className="status-subtext">{gameStatus.subtext}</div>
          )}
        </div>
      </div>

      {/* QR Code during DECK_BUILDING phase */}
      {roomState.phase === "DECK_BUILDING" && showQR && (
        <div className="board-qr-code-section">
          <div className="board-qr-code-container">
            {onCloseQR && (
              <CloseButton onClose={onCloseQR} title="Close QR code" />
            )}
            <p className="board-qr-hint">Scan to join</p>
            <QRCode url={roomState.serverUrl} size={180} />
          </div>
        </div>
      )}

      {/* Decorative background */}
      <div className="board-scenic-background">
        <img
          src={
            roomState.boardBackgroundImage ||
            "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1600&q=80"
          }
          alt="Background"
          className="board-background-image"
        />
      </div>

      {/* Score track */}
      <div className="score-track-container" ref={svgContainerRef}>
        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="score-track-svg"
        >
          {/* Define reusable circular clip path */}
          <defs>
            <clipPath id="token-circle-mask">
              <circle cx="0" cy="0" r={tokenSize} />
            </clipPath>
          </defs>
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
                strokeWidth={2 * scaleFactor}
              />
            );
          })}

          {/* Draw spaces */}
          {pathPositions.map((pos) => {
            const scoreNumber = pos.index; // Display 0-30 (scoreNumber matches player.score)
            // Mark the winning position (default is 30, can be configured by admin)
            const isWinTarget = scoreNumber === (roomState.winTarget || 30);

            return (
              <g key={`space-${pos.index}`}>
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={tokenSize * scaleFactor * 1.3}
                  className={`path-space ${isWinTarget ? "win-space" : ""}`}
                  fill={isWinTarget ? "#f39c12" : "#e8d4b8"}
                  stroke="#8b6f47"
                  strokeWidth={0.5 * scaleFactor}
                />

                {/* Score number */}
                <text
                  x={pos.x}
                  y={pos.y + 0.6 * scaleFactor}
                  className="space-number"
                  fill="#3d2817"
                  fontSize={2.8 * scaleFactor}
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {scoreNumber}
                </text>
              </g>
            );
          })}

          {/* Draw player tokens separately for smooth animation */}
          {roomState.players.map((player) => {
            const displayScore =
              animatingScores[player.id] !== undefined
                ? animatingScores[player.id]
                : player.score;
            const position = pathPositions[displayScore] || pathPositions[0];

            // Count players at same position for offset (scaled)
            const playersAtSamePosition = roomState.players.filter((p) => {
              const pScore =
                animatingScores[p.id] !== undefined
                  ? animatingScores[p.id]
                  : p.score;
              return pScore === displayScore;
            });
            const positionIndex = playersAtSamePosition.findIndex(
              (p) => p.id === player.id
            );
            const offsetX =
              (positionIndex * 2.5 -
                (playersAtSamePosition.length - 1) * 1.25) *
              scaleFactor;

            const delta = roomState.lastScoreDeltas.find(
              (d) => d.playerId === player.id
            );
            const isMoving = isAnimating && delta && delta.delta !== 0;

            const tokenX = position.x + offsetX;
            const tokenY = position.y - 5 * scaleFactor;

            // Get color based on point gain for delta display
            const getDeltaColor = (points: number) => {
              if (points >= 3) return "#f1c40f"; // Gold for 3+ points
              if (points === 2) return "#3498db"; // Blue for 2 points
              if (points === 1) return "#2ecc71"; // Green for 1 point
              return "#95a5a6"; // Gray for 0 points
            };

            return (
              <g key={player.id}>
                {/* Trail effect - simple, relaxed path */}
                {isMoving &&
                  delta.delta > 0 &&
                  (() => {
                    const prevScore = Math.max(0, player.score - delta.delta);
                    const prevPos =
                      pathPositions[prevScore] || pathPositions[0];
                    const prevX = prevPos.x + offsetX;
                    const prevY = prevPos.y - 5 * scaleFactor;

                    return (
                      <line
                        x1={prevX}
                        y1={prevY}
                        x2={tokenX}
                        y2={tokenY}
                        stroke={getDeltaColor(delta.delta)}
                        strokeWidth={1 * scaleFactor}
                        opacity="0.3"
                        className="token-trail"
                      />
                    );
                  })()}

                <g
                  className={`token-group ${
                    isAnimating ? "token-animating" : ""
                  } ${isMoving ? "token-moving" : ""}`}
                  style={{
                    willChange: isAnimating ? "transform" : "auto",
                  }}
                >
                  {player.tokenImage ? (
                    /* Token with custom image */
                    <g
                      transform={`translate(${tokenX}, ${tokenY})`}
                      style={{
                        transition: isAnimating
                          ? "transform 2s cubic-bezier(0.4, 0.0, 0.2, 1)"
                          : "none",
                        willChange: isAnimating ? "transform" : "auto",
                      }}
                    >
                      {/* Glow effect during animation */}
                      {isMoving && (
                        <circle
                          cx="0"
                          cy="0"
                          r={tokenSize * scaleFactor * 1.5}
                          fill={getDeltaColor(delta.delta)}
                          opacity="0.3"
                          className="token-glow"
                        />
                      )}
                      <g
                        clipPath="url(#token-circle-mask)"
                        transform={`scale(${scaleFactor})`}
                      >
                        <image
                          href={player.tokenImage}
                          x={-tokenSize}
                          y={-tokenSize}
                          width={tokenSize * 2}
                          height={tokenSize * 2}
                          preserveAspectRatio="xMidYMid slice"
                        />
                      </g>
                      <circle
                        cx="0"
                        cy="0"
                        r={tokenSize * scaleFactor}
                        fill="none"
                        stroke={isMoving ? getDeltaColor(delta.delta) : "#fff"}
                        strokeWidth={
                          isMoving ? 1 * scaleFactor : 0.5 * scaleFactor
                        }
                        className="player-token-border"
                        style={{
                          transition: "stroke 0.3s, stroke-width 0.3s",
                        }}
                      />
                    </g>
                  ) : (
                    /* Token with color fallback */
                    <>
                      {/* Glow effect during animation */}
                      {isMoving && (
                        <circle
                          cx={tokenX}
                          cy={tokenY}
                          r={tokenSize * scaleFactor * 1.5}
                          fill={getDeltaColor(delta.delta)}
                          opacity="0.3"
                          className="token-glow"
                        />
                      )}
                      <circle
                        cx={tokenX}
                        cy={tokenY}
                        r={tokenSize * scaleFactor}
                        fill={getPlayerColor(player.id)}
                        stroke={isMoving ? getDeltaColor(delta.delta) : "#fff"}
                        strokeWidth={
                          isMoving ? 1 * scaleFactor : 0.5 * scaleFactor
                        }
                        className="player-token"
                        style={{
                          transition: isAnimating
                            ? "cx 2s cubic-bezier(0.4, 0.0, 0.2, 1), cy 2s cubic-bezier(0.4, 0.0, 0.2, 1), stroke 0.3s, stroke-width 0.3s"
                            : "stroke 0.3s, stroke-width 0.3s",
                          willChange: isAnimating ? "transform" : "auto",
                        }}
                      />
                    </>
                  )}
                  {roomState.storytellerId === player.id && (
                    <text
                      x={tokenX}
                      y={tokenY + 0.5 * scaleFactor}
                      fontSize={3 * scaleFactor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{
                        transition: isAnimating
                          ? "x 2s cubic-bezier(0.4, 0.0, 0.2, 1), y 2s cubic-bezier(0.4, 0.0, 0.2, 1)"
                          : "none",
                        pointerEvents: "none",
                      }}
                    >
                      📖
                    </text>
                  )}
                  {/* Score delta display - larger and more visible */}
                  {isMoving && (
                    <g className="score-delta-container">
                      {/* Background for better visibility */}
                      <rect
                        x={tokenX - 4 * scaleFactor}
                        y={tokenY - 10 * scaleFactor}
                        width={8 * scaleFactor}
                        height={5 * scaleFactor}
                        fill="rgba(0, 0, 0, 0.7)"
                        rx={1 * scaleFactor}
                        className="score-delta-bg"
                        style={{
                          transition: isAnimating
                            ? "x 2s cubic-bezier(0.4, 0.0, 0.2, 1), y 2s cubic-bezier(0.4, 0.0, 0.2, 1)"
                            : "none",
                        }}
                      />
                      <text
                        x={tokenX}
                        y={tokenY - 7 * scaleFactor}
                        fontSize={4 * scaleFactor}
                        fontWeight="bold"
                        textAnchor="middle"
                        fill={getDeltaColor(delta.delta)}
                        className="score-delta-floating"
                        style={{
                          transition: isAnimating
                            ? "x 2s cubic-bezier(0.4, 0.0, 0.2, 1), y 2s cubic-bezier(0.4, 0.0, 0.2, 1)"
                            : "none",
                          filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.8))`,
                        }}
                      >
                        +{delta.delta}
                      </text>
                    </g>
                  )}
                </g>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
