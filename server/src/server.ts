import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { GameManager } from './game/GameManager.js';
import { DeckMode } from './game/types.js';
import {
  joinSchema,
  adminSetDeckModeSchema,
  adminSetWinTargetSchema,
  uploadImageSchema,
  deleteImageSchema,
  storytellerSubmitSchema,
  playerSubmitCardSchema,
  playerVoteSchema,
  changeNameSchema,
  kickPlayerSchema,
  promotePlayerSchema,
} from './utils/validation.js';
import { getLanIpAddress } from './utils/network.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp(port: number = 3000) {
  // Get server URL (prefer LAN IP)
  const lanIp = getLanIpAddress();
  const serverUrl = lanIp ? `http://${lanIp}:${port}` : `http://localhost:${port}`;
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Single game instance (in-memory)
  const gameManager = new GameManager();

  // Map socket.id to clientId
  const socketToClient = new Map<string, string>();

  // Serve static files (built client)
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));

  // Fallback to index.html for SPA routing
  app.get('*', (req, res) => {
    const indexPath = path.join(publicPath, 'index.html');
    
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
    io.emit('roomState', roomState);
  }

  // Helper to send player state
  function sendPlayerState(socketId: string, clientId: string) {
    const playerState = gameManager.getPlayerState(clientId);
    if (playerState) {
      io.to(socketId).emit('playerState', playerState);
    }
  }

  // Socket.IO event handlers
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join', (data) => {
      try {
        const { name, clientId } = joinSchema.parse(data);
        
        const player = gameManager.addPlayer(name, clientId);
        socketToClient.set(socket.id, clientId);

        console.log(`Player joined: ${name} (${clientId})`);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);

        socket.emit('joinSuccess', { playerId: clientId });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminSetDeckMode', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { mode } = adminSetDeckModeSchema.parse(data);
        gameManager.setDeckMode(mode as DeckMode, clientId);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminSetWinTarget', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { target } = adminSetWinTargetSchema.parse(data);
        gameManager.setWinTarget(target, clientId);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('uploadImage', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { imageData } = uploadImageSchema.parse(data);
        const card = gameManager.uploadImage(imageData, clientId);

        console.log(`Image uploaded by ${clientId}: ${card.id}`);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('deleteImage', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { imageId } = deleteImageSchema.parse(data);
        gameManager.deleteImage(imageId, clientId);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('lockDeck', () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        gameManager.lockDeck(clientId);
        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('startGame', () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        gameManager.startGame(clientId);
        
        broadcastRoomState();
        
        // Send updated hands to all players
        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        io.emit('phaseChanged', { phase: gameManager.getCurrentPhase() });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('storytellerSubmit', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { cardId, clue } = storytellerSubmitSchema.parse(data);
        
        gameManager.storytellerSubmitCard(clientId, cardId, clue);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);
        io.emit('phaseChanged', { phase: gameManager.getCurrentPhase() });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('playerSubmitCard', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { cardId } = playerSubmitCardSchema.parse(data);
        
        gameManager.playerSubmitCard(clientId, cardId);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);

        // Check if phase changed (all submitted)
        const currentPhase = gameManager.getCurrentPhase();
        if (currentPhase !== 'PLAYERS_CHOICE') {
          io.emit('phaseChanged', { phase: currentPhase });
          
          // Give a moment for REVEAL, then transition to VOTING
          if (currentPhase === 'REVEAL') {
            setTimeout(() => {
              io.emit('phaseChanged', { phase: gameManager.getCurrentPhase() });
              broadcastRoomState();
            }, 3000);
          }
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('playerVote', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { cardId } = playerVoteSchema.parse(data);
        gameManager.playerVote(clientId, cardId);

        broadcastRoomState();
        sendPlayerState(socket.id, clientId);

        // Check if phase changed (all voted)
        const currentPhase = gameManager.getCurrentPhase();
        if (currentPhase === 'SCORING') {
          io.emit('phaseChanged', { phase: currentPhase });
          broadcastRoomState();
        }
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('advanceRound', () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        gameManager.advanceToNextRound();

        // Send updated hands
        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        broadcastRoomState();
        io.emit('phaseChanged', { phase: gameManager.getCurrentPhase() });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminResetGame', () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        gameManager.resetGame(clientId);

        broadcastRoomState();
        
        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        io.emit('phaseChanged', { phase: gameManager.getCurrentPhase() });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminNewDeck', () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        gameManager.newDeck(clientId);

        broadcastRoomState();
        
        for (const [socketId, cId] of socketToClient.entries()) {
          sendPlayerState(socketId, cId);
        }

        io.emit('phaseChanged', { phase: gameManager.getCurrentPhase() });
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('changeName', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { newName } = changeNameSchema.parse(data);
        gameManager.changeName(clientId, newName);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminKickPlayer', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

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
            targetSocket.emit('error', { message: 'You have been kicked from the game' });
            targetSocket.disconnect(true);
          }
          socketToClient.delete(targetSocketId);
        }

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminUnlockDeck', () => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        gameManager.unlockDeck(clientId);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('adminPromotePlayer', (data) => {
      try {
        const clientId = socketToClient.get(socket.id);
        if (!clientId) throw new Error('Not authenticated');

        const { targetPlayerId } = promotePlayerSchema.parse(data);
        gameManager.promoteToAdmin(clientId, targetPlayerId);

        broadcastRoomState();
      } catch (error: any) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('disconnect', () => {
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

