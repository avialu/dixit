import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { GameManager } from "./game/GameManager.js";
import { serverConfig, rateLimitConfig } from "./config/index.js";
import {
  joinSchema,
  adminSetWinTargetSchema,
  uploadImageSchema,
  deleteImageSchema,
  storytellerSubmitSchema,
  playerSubmitCardSchema,
  playerVoteSchema,
  changeNameSchema,
  kickPlayerSchema,
  promotePlayerSchema,
  reconnectSchema,
  joinSpectatorSchema,
  adminSetAllowPlayerUploadsSchema,
  uploadTokenImageSchema,
  setBoardBackgroundSchema,
  setBoardPatternSchema,
  adminSetLanguageSchema,
} from "./utils/validation.js";
import { getLanIpAddress } from "./utils/network.js";
import {
  GameError,
  ValidationError,
  PermissionError,
  NetworkError,
  RateLimitError,
  ErrorSeverity,
  getErrorMessage,
  getErrorCode,
  getErrorSeverity,
  isRetryable,
} from "./utils/errors.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(port: number = serverConfig.port) {
  // Get server URL (prefer ENV, then LAN IP, then localhost)
  const envServerUrl = serverConfig.url;
  const lanIp = getLanIpAddress();
  const serverUrl =
    envServerUrl ||
    (lanIp ? `http://${lanIp}:${port}` : `http://localhost:${port}`);
  const app = express();
  const httpServer = createServer(app);
  // CORS configuration - restrict to allowed origins
  const allowedOrigins = [...serverConfig.allowedOrigins];
  
  // Add LAN IP if available
  if (lanIp) {
    allowedOrigins.push(`http://${lanIp}:${port}`);
    allowedOrigins.push(`http://${lanIp}:5174`);
  }

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Rate limiting to prevent abuse
  const apiLimiter = rateLimit({
    windowMs: rateLimitConfig.apiWindowMs,
    max: rateLimitConfig.apiMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again later.",
  });

  // Apply rate limiting to API routes
  app.use("/api/", apiLimiter);

  // Single game instance (in-memory)
  const gameManager = new GameManager();

  // Map socket.id to clientId
  const socketToClient = new Map<string, string>();
  
  // Disconnect grace period timers - gives players 5 seconds to reconnect
  const disconnectTimers = new Map<string, NodeJS.Timeout>();
  const DISCONNECT_GRACE_PERIOD = 5000; // 5 seconds
  
  // Socket event rate limiting (per socket)
  const socketEventCounts = new Map<string, { count: number; resetTime: number }>();
  
  // Track last rate limit warning per socket to avoid spam
  const lastRateLimitWarning = new Map<string, number>();
  const RATE_LIMIT_WARNING_COOLDOWN = 5000; // Only log once per 5 seconds per socket
  
  function checkSocketRateLimit(socketId: string): boolean {
    const now = Date.now();
    const record = socketEventCounts.get(socketId);
    
    if (!record || now > record.resetTime) {
      socketEventCounts.set(socketId, { 
        count: 1, 
        resetTime: now + rateLimitConfig.socketWindowMs 
      });
      return true;
    }
    
    if (record.count >= rateLimitConfig.socketMax) {
      return false;
    }
    
    record.count++;
    return true;
  }

  // Helper: Validate client is registered (middleware pattern with async support + rate limiting)
  type SocketCallback = (clientId: string) => void | Promise<void>;

  async function withClientId(socket: any, callback: SocketCallback): Promise<void> {
    // Check rate limit first
    if (!checkSocketRateLimit(socket.id)) {
      const error = new RateLimitError("Too many requests. Please slow down.", 10);
      socket.emit("error", error.toJSON());
      
      // Only log rate limit warning if we haven't logged recently
      const now = Date.now();
      const lastWarning = lastRateLimitWarning.get(socket.id) || 0;
      if (now - lastWarning > RATE_LIMIT_WARNING_COOLDOWN) {
        logger.warn("Socket rate limit exceeded", { socketId: socket.id });
        lastRateLimitWarning.set(socket.id, now);
      }
      return;
    }
    
    const clientId = socketToClient.get(socket.id);
    if (!clientId) {
      const error = new ValidationError("Please join the game first");
      socket.emit("error", error.toJSON());
      return;
    }
    try {
      await callback(clientId);
    } catch (error) {
      // Handle specific error types with enhanced error objects
      if (error instanceof ValidationError) {
        socket.emit("validationError", error.toJSON());
        logger.warn("Validation error", { clientId, error: error.message });
      } else if (error instanceof PermissionError) {
        socket.emit("permissionError", error.toJSON());
        logger.warn("Permission error", { clientId, error: error.message });
      } else if (error instanceof RateLimitError) {
        socket.emit("rateLimitError", error.toJSON());
        logger.warn("Rate limit error", { clientId, error: error.message });
      } else if (error instanceof GameError) {
        socket.emit("gameError", error.toJSON());
        logger.error("Game error", { clientId, error: error.message });
      } else {
        const message = getErrorMessage(error);
        const gameError = new GameError(message, 'UNKNOWN_ERROR', 500, ErrorSeverity.ERROR, false);
        socket.emit("error", gameError.toJSON());
        logger.error("Unexpected error", { clientId, error: message });
      }
    }
  }

  // Serve static files (built client)
  const publicPath = path.join(__dirname, "..", "public");
  app.use(express.static(publicPath));

  // API endpoint to get server URL
  app.get("/api/server-info", (req, res) => {
    res.json({ serverUrl });
  });

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      players: gameManager.getRoomState().players.length,
      phase: gameManager.getRoomState().phase,
    });
  });

  // Simple ping endpoint
  app.get("/ping", (req, res) => {
    res.status(200).send("pong");
  });

  // Fallback to index.html for SPA routing
  app.get("*", (req, res) => {
    const indexPath = path.join(publicPath, "index.html");

    // Check if built client exists
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Dixit - Dev Mode</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                padding: 2rem;
                background: #1a1a2e;
                color: #eee;
                max-width: 800px;
                margin: 0 auto;
              }
              a { color: #4a90e2; text-decoration: none; }
              a:hover { text-decoration: underline; }
              pre {
                background: #2a2a3e;
                padding: 1rem;
                border-radius: 8px;
                overflow-x: auto;
              }
              .box {
                background: #2a2a3e;
                padding: 1.5rem;
                border-radius: 12px;
                margin: 1rem 0;
              }
            </style>
          </head>
          <body>
            <h1>🎨 Dixit Server Running</h1>
            
            <div class="box">
              <h2>Development Mode</h2>
              <p>The Vite dev server is running. Please visit:</p>
              <p><strong><a href="http://localhost:5174">http://localhost:5174</a></strong></p>
              <p><em>This provides hot-reload during development.</em></p>
            </div>

            <div class="box">
              <h2>For LAN Play (Production)</h2>
              <p>Build the client and restart the server:</p>
              <pre>npm run build
npm start</pre>
              <p>Then players can join using this server directly.</p>
            </div>

            <hr style="margin: 2rem 0; border: 1px solid #333;">
            <p style="color: #888;"><small>Server: http://localhost:3000 | Socket.IO connected ✓</small></p>
          </body>
        </html>
      `);
    }
  });

  // Helper to broadcast room state
  function broadcastRoomState() {
    const roomState = gameManager.getRoomState();
    // Add server URL for QR code
    roomState.serverUrl = serverUrl;
    io.emit("roomState", roomState);
  }

  // Helper to send player state
  function sendPlayerState(socketId: string, clientId: string) {
    const playerState = gameManager.getPlayerState(clientId);
    if (playerState) {
      io.to(socketId).emit("playerState", playerState);
    }
  }

  // Socket.IO event handlers
  io.on("connection", (socket) => {
    logger.debug("Client connected", { socketId: socket.id });

    // Send initial room state immediately so QR code shows correct URL
    broadcastRoomState();

    // Handle client ping for latency measurement
    socket.on("clientPing", () => {
      socket.emit("clientPong");
    });

    // Handle reconnection - allows client to re-register their socket with their clientId
    socket.on("reconnect", (data) => {
      try {
        const parsed = reconnectSchema.parse(data);
        const { clientId } = parsed;

        // Cancel any pending disconnect timer for this client
        const existingTimer = disconnectTimers.get(clientId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          disconnectTimers.delete(clientId);
          logger.debug("Cancelled disconnect timer for reconnecting client", { clientId });
        }

        // Check if this is a player (in game) or spectator (just watching)
        const player = gameManager.getPlayer(clientId);
        const isSpectator = !player;
        
        if (isSpectator) {
          // Spectator reconnection - just re-register the socket
          socketToClient.set(socket.id, clientId);
          logger.info("Spectator reconnected", { clientId, socketId: socket.id });
          
          // Send fresh state
          broadcastRoomState();
          socket.emit("reconnectSuccess", { playerId: clientId });
        } else {
          // Player reconnection - verify player exists and mark as connected
          socketToClient.set(socket.id, clientId);
          player.reconnect(); // Mark player as connected
          
          logger.info("Player reconnected", { clientId, socketId: socket.id, playerName: player.name });

          // Check if player needs hand repair (edge case recovery)
          const currentPhase = gameManager.getCurrentPhase();
          const repaired = gameManager.repairPlayerHand(clientId);
          if (repaired) {
            logger.warn("Player hand was repaired on reconnect", { clientId, playerName: player.name, phase: currentPhase });
          }

          // Send fresh state
          broadcastRoomState();
          
          // Always send player state, especially important during game phases
          sendPlayerState(socket.id, clientId);
          
          // Log hand size for debugging
          const playerState = gameManager.getPlayerState(clientId);
          if (playerState) {
            logger.info("Sent hand to reconnected player", { 
              clientId, 
              handSize: playerState.hand.length,
              phase: currentPhase
            });
          }
          
          socket.emit("reconnectSuccess", { playerId: clientId });
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Reconnection failed";
        socket.emit("error", { 
          message, 
          code: 'RECONNECT_ERROR',
          severity: 'error'
        });
        logger.error("Reconnection error", { error: message });
      }
    });

    socket.on("join", (data) => {
      try {
        const { name, clientId } = joinSchema.parse(data);

        const player = gameManager.addPlayer(name, clientId);
        socketToClient.set(socket.id, clientId);

        logger.playerAction(clientId, "joined game", { name });

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);

        socket.emit("joinSuccess", { playerId: clientId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to join game";
        socket.emit("error", { message });
      }
    });

    socket.on("joinSpectator", (data) => {
      try {
        const parsed = joinSpectatorSchema.parse(data);
        const { clientId } = parsed;

        // Register the spectator's socket with their actual clientId
        socketToClient.set(socket.id, clientId);

        logger.info("Spectator joined", { clientId });

        broadcastRoomState();
        socket.emit("joinSpectatorSuccess", { spectatorId: clientId });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to join as spectator";
        socket.emit("error", { message });
      }
    });

    socket.on("adminSetAllowPlayerUploads", (data) => {
      withClientId(socket, (clientId) => {
        const parsed = adminSetAllowPlayerUploadsSchema.parse(data);
        const { allow } = parsed;

        gameManager.setAllowPlayerUploads(allow, clientId);

        broadcastRoomState();
      });
    });

    socket.on("adminSetWinTarget", (data) => {
      withClientId(socket, (clientId) => {
        const { target } = adminSetWinTargetSchema.parse(data);
        gameManager.setWinTarget(target, clientId);

        broadcastRoomState();
      });
    });

    socket.on("adminSetBoardBackground", (data) => {
      withClientId(socket, (clientId) => {
        const { imageData } = setBoardBackgroundSchema.parse(data);
        gameManager.setBoardBackgroundImage(imageData, clientId);

        broadcastRoomState();
      });
    });

    socket.on("adminSetBoardPattern", (data) => {
      withClientId(socket, (clientId) => {
        const { pattern } = setBoardPatternSchema.parse(data);
        gameManager.setBoardPattern(pattern, clientId);

        broadcastRoomState();
      });
    });

    socket.on("adminSetLanguage", (data) => {
      withClientId(socket, (clientId) => {
        const { language } = adminSetLanguageSchema.parse(data);
        gameManager.setLanguage(language, clientId);

        logger.playerAction(clientId, "set language", { language });
        broadcastRoomState();
      });
    });

    socket.on("uploadImage", (data) => {
      withClientId(socket, (clientId) => {
        try {
          const { imageData } = uploadImageSchema.parse(data);
          const card = gameManager.uploadImage(imageData, clientId);

          logger.playerAction(clientId, "uploaded image", { cardId: card.id });

          // Send the new image to all clients via incremental update
          // Include deckSize so clients can update their count without needing full roomState
          io.emit("imageAdded", {
            id: card.id,
            uploadedBy: clientId,
            imageData: card.imageData,
            deckSize: gameManager.getDeckSize(),
          });
          
          // No roomState broadcast needed - imageAdded provides all necessary info
          // This reduces network traffic by ~50% during bulk uploads
          
          // Acknowledge successful upload
          socket.emit("uploadImageAck", { success: true, imageId: card.id });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Upload failed";
          socket.emit("uploadImageAck", { success: false, error: errorMessage });
        }
      });
    });

    socket.on("deleteImage", (data) => {
      withClientId(socket, (clientId) => {
        const { imageId } = deleteImageSchema.parse(data);
        const deleted = gameManager.deleteImage(imageId, clientId);

        if (deleted) {
          logger.playerAction(clientId, "deleted image", { imageId });
          
          // Send incremental delete update with deckSize for consistency with imageAdded
          // This prevents client deck size from drifting during bulk deletions
          io.emit("imageDeleted", { id: imageId, deckSize: gameManager.getDeckSize() });
        }

        // No roomState broadcast needed - imageDeleted provides all necessary info
        // This reduces network traffic during bulk deletions
      });
    });

    socket.on("lockDeck", () => {
      withClientId(socket, (clientId) => {
        gameManager.lockDeck(clientId);
        broadcastRoomState();
      });
    });

    socket.on("startGame", () => {
      withClientId(socket, (clientId) => {
        gameManager.startGame(clientId);

        broadcastRoomState();

        // Send updated hands to all players
        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        io.emit("phaseChanged", { phase: gameManager.getCurrentPhase() });
        
        // Acknowledge the action
        socket.emit("startGameAck", { success: true });
      });
    });

    socket.on("storytellerSubmit", (data) => {
      withClientId(socket, (clientId) => {
        const { cardId, clue } = storytellerSubmitSchema.parse(data);

        gameManager.storytellerSubmitCard(clientId, cardId, clue);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);
        io.emit("phaseChanged", { phase: gameManager.getCurrentPhase() });
        
        // Acknowledge the action
        socket.emit("storytellerSubmitAck", { success: true, cardId, clue });
      });
    });

    socket.on("playerSubmitCard", (data) => {
      withClientId(socket, (clientId) => {
        const { cardId } = playerSubmitCardSchema.parse(data);

        gameManager.playerSubmitCard(clientId, cardId);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);

        // Check if phase changed (all submitted)
        const currentPhase = gameManager.getCurrentPhase();
        if (currentPhase !== "PLAYERS_CHOICE") {
          io.emit("phaseChanged", { phase: currentPhase });
        }
        
        // Acknowledge the action
        socket.emit("playerSubmitCardAck", { success: true, cardId });
      });
    });

    socket.on("playerVote", (data) => {
      withClientId(socket, (clientId) => {
        const { cardId } = playerVoteSchema.parse(data);
        gameManager.playerVote(clientId, cardId);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);

        // Check if phase changed (all voted)
        const currentPhase = gameManager.getCurrentPhase();
        if (currentPhase === "REVEAL") {
          io.emit("phaseChanged", { phase: currentPhase });
          broadcastRoomState();
        }
        
        // Acknowledge the action
        socket.emit("playerVoteAck", { success: true, cardId });
      });
    });

    socket.on("advanceRound", () => {
      withClientId(socket, (clientId) => {
        gameManager.advanceToNextRound(clientId);

        // Send updated hands
        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        broadcastRoomState();
        io.emit("phaseChanged", { phase: gameManager.getCurrentPhase() });
        
        // Acknowledge the action
        socket.emit("advanceRoundAck", { success: true });
      });
    });

    socket.on("adminResetGame", () => {
      withClientId(socket, (clientId) => {
        gameManager.resetGame(clientId);

        broadcastRoomState();

        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        io.emit("phaseChanged", { phase: gameManager.getCurrentPhase() });
        
        // Acknowledge the action
        socket.emit("adminResetGameAck", { success: true });
      });
    });

    socket.on("adminNewDeck", () => {
      withClientId(socket, (clientId) => {
        gameManager.newDeck(clientId);

        broadcastRoomState();

        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        io.emit("phaseChanged", { phase: gameManager.getCurrentPhase() });
        
        // Acknowledge the action
        socket.emit("adminNewDeckAck", { success: true });
      });
    });

    socket.on("changeName", (data) => {
      withClientId(socket, (clientId) => {
        const { newName } = changeNameSchema.parse(data);
        gameManager.changeName(clientId, newName);

        broadcastRoomState();
      });
    });

    socket.on("uploadTokenImage", (data) => {
      withClientId(socket, (clientId) => {
        const parsed = uploadTokenImageSchema.parse(data);
        const { imageData } = parsed;
        gameManager.setPlayerTokenImage(clientId, imageData);

        broadcastRoomState();
      });
    });

    socket.on("adminKickPlayer", (data) => {
      withClientId(socket, (clientId) => {
        const { targetPlayerId } = kickPlayerSchema.parse(data);

        // Find the socket for the target player and disconnect them
        let targetSocketId: string | undefined;
        for (const [socketId, playerId] of socketToClient.entries()) {
          if (playerId === targetPlayerId) {
            targetSocketId = socketId;
            break;
          }
        }

        gameManager.kickPlayer(clientId, targetPlayerId);

        // Disconnect the kicked player's socket
        if (targetSocketId) {
          const targetSocket = io.sockets.sockets.get(targetSocketId);
          if (targetSocket) {
            // Send a specific "kicked" event so client can handle redirect
            targetSocket.emit("kicked", {
              message: "You have been kicked from the game by the admin",
            });
            // Small delay to ensure event is received before disconnect
            setTimeout(() => {
              targetSocket.disconnect(true);
            }, 100);
          }
          socketToClient.delete(targetSocketId);
        }

        broadcastRoomState();
      });
    });

    socket.on("adminUnlockDeck", () => {
      withClientId(socket, (clientId) => {
        gameManager.unlockDeck(clientId);

        broadcastRoomState();
      });
    });

    socket.on("adminPromotePlayer", (data) => {
      withClientId(socket, (clientId) => {
        const { targetPlayerId } = promotePlayerSchema.parse(data);
        gameManager.promoteToAdmin(clientId, targetPlayerId);

        broadcastRoomState();
      });
    });

    socket.on("leave", () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (clientId) {
          logger.info("Player/Spectator leaving", { clientId });

          // Cancel any pending disconnect timer
          const existingTimer = disconnectTimers.get(clientId);
          if (existingTimer) {
            clearTimeout(existingTimer);
            disconnectTimers.delete(clientId);
          }

          // Permanently remove player (leavePlayer will only remove if they're in players list)
          gameManager.leavePlayer(clientId);
          socketToClient.delete(socket.id);
          socketEventCounts.delete(socket.id);
          lastRateLimitWarning.delete(socket.id);

          broadcastRoomState();
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to leave game";
        socket.emit("error", { message });
      }
    });

    socket.on("disconnect", () => {
      const clientId = socketToClient.get(socket.id);
      if (clientId) {
        logger.info("Player disconnected - starting grace period", { 
          clientId, 
          socketId: socket.id,
          gracePeriodMs: DISCONNECT_GRACE_PERIOD 
        });
        
        // Mark player as disconnected immediately
        gameManager.removePlayer(clientId);
        
        // Clean up socket tracking immediately
        socketToClient.delete(socket.id);
        socketEventCounts.delete(socket.id);
        lastRateLimitWarning.delete(socket.id);
        
        // Set a timer to fully remove player if they don't reconnect
        const timer = setTimeout(() => {
          // Check if player reconnected (would have a new socket mapping)
          let hasReconnected = false;
          for (const [_, cId] of socketToClient.entries()) {
            if (cId === clientId) {
              hasReconnected = true;
              break;
            }
          }
          
          if (!hasReconnected) {
            logger.info("Grace period expired - player did not reconnect", { clientId });
            // Player is already marked as disconnected, just broadcast state
            broadcastRoomState();
          }
          
          disconnectTimers.delete(clientId);
        }, DISCONNECT_GRACE_PERIOD);
        
        disconnectTimers.set(clientId, timer);
        
        // Broadcast state immediately to show player as disconnected
        broadcastRoomState();
      }
    });
  });

  return { app, httpServer, io, gameManager };
}
