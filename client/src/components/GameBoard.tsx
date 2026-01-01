import { useState, useEffect, useRef } from "react";
import { RoomState } from "../hooks/useGameState";
import { QRCode } from "./QRCode";
import { CloseButton, Icon, IconSize } from "./ui";
import { getMinimumDeckSize } from "../utils/imageConstants";
import { useTranslation } from "../i18n";
import { handleImageUploadEvent } from "../utils/imageResize";

interface GameBoardProps {
  roomState: RoomState;
  playerId?: string; // Current player's ID to check admin status
  showQR?: boolean;
  onCloseQR?: () => void;
  revealModalOpen?: boolean; // Track if REVEAL modal is open
  onUploadTokenImage?: (imageData: string | null) => void; // Callback to upload profile image
}

export function GameBoard({
  roomState,
  playerId,
  showQR = true,
  onCloseQR,
  revealModalOpen = false,
  onUploadTokenImage,
}: GameBoardProps) {
  const { t } = useTranslation(roomState.language);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const tokenFileInputRef = useRef<HTMLInputElement>(null);
  const [containerDimensions, setContainerDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [copiedLink, setCopiedLink] = useState(false);

  // Handle token image upload
  const handleTokenImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onUploadTokenImage) return;
    handleImageUploadEvent(e, onUploadTokenImage, undefined, tokenFileInputRef);
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(roomState.serverUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Freeze scores at previous positions while REVEAL modal is open
  const [frozenScores, setFrozenScores] = useState<{
    [playerId: string]: number;
  } | null>(null);
  const lastRevealRound = useRef<number>(-1);

  // Dynamic track length based on win target (e.g., winTarget=30 → trackLength=31 for positions 0-30)
  const winTarget = roomState.winTarget || 30;
  const trackLength = winTarget + 1; // Add 1 to include position 0

  // Freeze scores when REVEAL starts, unfreeze when modal closes
  useEffect(() => {
    if (
      roomState.phase === "REVEAL" &&
      roomState.lastScoreDeltas.length > 0 &&
      lastRevealRound.current !== roomState.currentRound
    ) {
      // New REVEAL round - freeze scores at previous positions
      lastRevealRound.current = roomState.currentRound;

      const previousScores: { [playerId: string]: number } = {};
      roomState.players.forEach((player) => {
        const delta = roomState.lastScoreDeltas.find(
          (d) => d.playerId === player.id
        );
        const prevScore = player.score - (delta?.delta || 0);
        previousScores[player.id] = Math.max(0, prevScore);
      });

      setFrozenScores(previousScores);
    } else if (roomState.phase === "REVEAL" && !revealModalOpen) {
      // Modal closed - unfreeze scores
      setFrozenScores(null);
    } else if (roomState.phase !== "REVEAL") {
      // Left REVEAL phase - clear frozen scores
      setFrozenScores(null);
    }
  }, [
    roomState.phase,
    roomState.currentRound,
    roomState.lastScoreDeltas,
    roomState.players,
    revealModalOpen,
  ]);

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
    const storytellerName = storyteller?.name || t("common.storyteller");
    const currentPlayer = playerId
      ? roomState.players.find((p) => p.id === playerId)
      : null;
    const isAdmin = currentPlayer?.isAdmin || false;
    const adminPlayer = roomState.players.find((p) => p.isAdmin);
    const adminName = adminPlayer?.name || "admin";

    switch (roomState.phase) {
      case "DECK_BUILDING": {
        const minRequired = getMinimumDeckSize(
          roomState.players.length,
          roomState.winTarget
        );
        const needMore = minRequired - roomState.deckSize;
        const isReady = roomState.deckSize >= minRequired;

        // Determine status text based on game readiness and admin status
        let statusText: string;
        if (roomState.players.length < 3) {
          statusText = t("status.waitingForPlayers");
        } else if (needMore > 0) {
          statusText = t("status.needMoreImages", { count: needMore });
        } else if (isAdmin) {
          statusText = t("status.readyToStart");
        } else {
          statusText = t("lobby.waitingForAdminName", { name: adminName });
        }

        return {
          icon: "🎴",
          text: statusText,
          subtext: "", // We'll use deckInfo instead
          deckInfo: {
            count: roomState.deckSize,
            isReady,
            playerCount: roomState.players.length,
          },
        };
      }
      case "STORYTELLER_CHOICE":
        return {
          icon: "🎭",
          text: t("status.storytellerChoosing", { name: storytellerName }),
          subtext: t("status.waitingForStoryteller", { name: storytellerName }),
        };
      case "PLAYERS_CHOICE":
        return {
          icon: "✍️",
          text: t("status.playersChoosing"),
          subtext: t("status.matchTheClue", {
            clue: roomState.currentClue || "",
          }),
        };
      case "REVEAL":
        return {
          icon: "🎊",
          text: t("status.cardsRevealed"),
          subtext: t("status.readyToVote"),
        };
      case "VOTING":
        return {
          icon: "🗳️",
          text: t("status.playersVoting"),
          subtext: t("status.whichCardIsStoryteller"),
        };
      case "SCORING":
        return {
          icon: "🏆",
          text: t("status.roundComplete"),
          subtext: t("status.calculatingScores"),
        };
      case "GAME_END":
        const winner = [...roomState.players].sort(
          (a, b) => b.score - a.score
        )[0];
        return {
          icon: "👑",
          text: t("status.winnerIs", {
            name: winner.name,
            score: winner.score,
          }),
          subtext: `${t("gameEnd.finalScores")}`,
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
          {gameStatus.deckInfo ? (
            <div className="status-subtext">
              <span
                className={`deck-count ${
                  gameStatus.deckInfo.isReady ? "deck-ready" : "deck-warning"
                }`}
              >
                {gameStatus.deckInfo.count} {t("common.images")}
              </span>
              {" | "}
              <span>
                {gameStatus.deckInfo.playerCount}{" "}
                {t("common.players").toLowerCase()}
              </span>
            </div>
          ) : gameStatus.subtext ? (
            <div className="status-subtext">{gameStatus.subtext}</div>
          ) : null}
        </div>
      </div>

      {/* Hidden file input for token image upload */}
      <input
        ref={tokenFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleTokenImageUpload}
        style={{ display: "none" }}
        aria-label={t("profile.tapToChange")}
      />

      {/* QR Code during DECK_BUILDING phase */}
      {roomState.phase === "DECK_BUILDING" && showQR && (
        <div className="board-qr-code-section">
          <div className="board-qr-code-container">
            {onCloseQR && (
              <CloseButton
                onClose={onCloseQR}
                title="Close QR code"
                className="board-qr-close-btn"
              />
            )}
            <p className="board-qr-hint">{t("join.scanToJoin")}</p>
            <QRCode url={roomState.serverUrl} size={180} />
            {/* Copyable link below QR code */}
            <button
              className="qr-copy-link"
              onClick={handleCopyLink}
              title={t("qr.clickToCopy")}
            >
              <Icon.Copy size={IconSize.small} />
              <span className="qr-link-text">
                {copiedLink
                  ? t("qr.copied")
                  : roomState.serverUrl
                      .replace(/^https?:\/\//, "")
                      .slice(0, 25) +
                    (roomState.serverUrl.length > 32 ? "..." : "")}
              </span>
            </button>
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

          {/* Draw player tokens - static, no animation */}
          {roomState.players.map((player) => {
            // Use frozen score if available (during REVEAL modal), otherwise actual score
            const actualScore = frozenScores?.[player.id] ?? player.score;
            // Cap display score at win target so winners are visible together
            const winTarget = roomState.winTarget || 30;
            const displayScore = Math.min(actualScore, winTarget);
            const position = pathPositions[displayScore] || pathPositions[0];

            // Count players at same position for offset (scaled)
            const playersAtSamePosition = roomState.players.filter((p) => {
              const pActualScore = frozenScores?.[p.id] ?? p.score;
              const pDisplayScore = Math.min(pActualScore, winTarget);
              return pDisplayScore === displayScore;
            });
            const positionIndex = playersAtSamePosition.findIndex(
              (p) => p.id === player.id
            );
            const offsetX =
              (positionIndex * 2.5 -
                (playersAtSamePosition.length - 1) * 1.25) *
              scaleFactor;

            const tokenX = position.x + offsetX;
            const tokenY = position.y - 5 * scaleFactor;

            // Check if this is the current player's token (editable)
            const isCurrentPlayer = player.id === playerId;
            const isEditable = isCurrentPlayer && onUploadTokenImage;

            return (
              <g
                key={player.id}
                style={{
                  pointerEvents: isEditable ? "auto" : "none",
                  cursor: isEditable ? "pointer" : "default",
                }}
                onClick={
                  isEditable
                    ? () => tokenFileInputRef.current?.click()
                    : undefined
                }
              >
                <g>
                  {player.tokenImage ? (
                    /* Token with custom image */
                    <g
                      transform={`translate(${tokenX}, ${tokenY})`}
                      className="player-token-group"
                    >
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
                        stroke="#fff"
                        strokeWidth={0.5 * scaleFactor}
                        className="player-token-border"
                      />
                    </g>
                  ) : (
                    /* Token with color fallback and name initials */
                    <g
                      transform={`translate(${tokenX}, ${tokenY})`}
                      className="player-token-group"
                    >
                      <circle
                        cx={0}
                        cy={0}
                        r={tokenSize * scaleFactor}
                        fill={getPlayerColor(player.id)}
                        stroke="#fff"
                        strokeWidth={0.5 * scaleFactor}
                      />
                      <text
                        x={0}
                        y={0}
                        fontSize={tokenSize * scaleFactor * 0.9}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="white"
                        fontWeight="bold"
                        style={{ pointerEvents: "none" }}
                      >
                        {player.name.slice(0, 2).toUpperCase()}
                      </text>
                    </g>
                  )}
                  {roomState.storytellerId === player.id && (
                    <text
                      x={tokenX}
                      y={tokenY + 0.5 * scaleFactor}
                      fontSize={3 * scaleFactor}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      🎭
                    </text>
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
