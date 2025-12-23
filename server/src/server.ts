import express from "express";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";
import { GameManager } from "./game/GameManager.js";
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
} from "./utils/validation.js";
import { getLanIpAddress } from "./utils/network.js";
import {
  GameError,
  ValidationError,
  PermissionError,
  getErrorMessage,
  getErrorCode,
} from "./utils/errors.js";
import { logger } from "./utils/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(port: number = 3000) {
  // Get server URL (prefer ENV, then LAN IP, then localhost)
  const envServerUrl = process.env.SERVER_URL;
  const lanIp = getLanIpAddress();
  const serverUrl =
    envServerUrl ||
    (lanIp ? `http://${lanIp}:${port}` : `http://localhost:${port}`);
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Single game instance (in-memory)
  const gameManager = new GameManager();

  // Map socket.id to clientId
  const socketToClient = new Map<string, string>();

  // Helper: Validate client is registered (middleware pattern)
  type SocketCallback = (clientId: string) => void | Promise<void>;

  function withClientId(socket: any, callback: SocketCallback): void {
    const clientId = socketToClient.get(socket.id);
    if (!clientId) {
      socket.emit("error", { message: "Please join the game first" });
      return;
    }
    try {
      callback(clientId);
    } catch (error) {
      // Handle specific error types
      if (error instanceof ValidationError) {
        socket.emit("validationError", {
          message: error.message,
          code: error.code,
        });
        logger.warn("Validation error", { clientId, error: error.message });
      } else if (error instanceof PermissionError) {
        socket.emit("permissionError", {
          message: error.message,
          code: error.code,
        });
        logger.warn("Permission error", { clientId, error: error.message });
      } else if (error instanceof GameError) {
        socket.emit("gameError", {
          message: error.message,
          code: error.code,
        });
        logger.error("Game error", { clientId, error: error.message });
      } else {
        const message = getErrorMessage(error);
        socket.emit("error", { message });
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
    console.log("Client connected:", socket.id);

    // Send initial room state immediately so QR code shows correct URL
    broadcastRoomState();

    // Handle reconnection - allows client to re-register their socket with their clientId
    socket.on("reconnect", (data) => {
      try {
        const { clientId } = data;

        if (!clientId) {
          socket.emit("error", { message: "clientId is required" });
          return;
        }

        // Re-register the socket (works for both players and spectators)
        socketToClient.set(socket.id, clientId);
        console.log(`Socket re-registered for clientId: ${clientId}`);

        // Send fresh state
        broadcastRoomState();
        sendPlayerState(socket.id, clientId);
        socket.emit("reconnectSuccess", { playerId: clientId });
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Reconnection failed";
        socket.emit("error", { message });
      }
    });

    socket.on("join", (data) => {
      try {
        const { name, clientId } = joinSchema.parse(data);

        const player = gameManager.addPlayer(name, clientId);
        socketToClient.set(socket.id, clientId);

        console.log(`Player joined: ${name} (${clientId})`);

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
        const { clientId } = data;

        // Register the spectator's socket with their actual clientId
        socketToClient.set(socket.id, clientId);

        console.log(`Spectator joined (${clientId})`);

        broadcastRoomState();
        socket.emit("joinSuccess", { playerId: clientId });
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
        const { allow } = data;
        if (typeof allow !== "boolean") {
          throw new Error("Invalid data: allow must be a boolean");
        }

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

    socket.on("uploadImage", (data) => {
      withClientId(socket, (clientId) => {
        const { imageData } = uploadImageSchema.parse(data);
        const card = gameManager.uploadImage(imageData, clientId);

        console.log(`Image uploaded by ${clientId}: ${card.id}`);

        broadcastRoomState();
      });
    });

    socket.on("deleteImage", (data) => {
      withClientId(socket, (clientId) => {
        const { imageId } = deleteImageSchema.parse(data);
        const deleted = gameManager.deleteImage(imageId, clientId);

        if (deleted) {
          console.log(`Image deleted by ${clientId}: ${imageId}`);
        }

        broadcastRoomState();
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
      });
    });

    socket.on("storytellerSubmit", (data) => {
      withClientId(socket, (clientId) => {
        const { cardId, clue } = storytellerSubmitSchema.parse(data);

        gameManager.storytellerSubmitCard(clientId, cardId, clue);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);
        io.emit("phaseChanged", { phase: gameManager.getCurrentPhase() });
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
        const { imageData } = data;
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
          console.log(`Player/Spectator leaving: ${clientId}`);

          // Permanently remove player (leavePlayer will only remove if they're in players list)
          gameManager.leavePlayer(clientId);
          socketToClient.delete(socket.id);

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
        console.log(`Player disconnected: ${clientId}`);
        gameManager.removePlayer(clientId);
        socketToClient.delete(socket.id);
        broadcastRoomState();
      }
    });
  });

  return { app, httpServer, io };
}
