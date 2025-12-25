/**
 * Integration Tests - Full Game Flow
 *
 * These tests verify the complete game flow from player join to game end
 */

import { describe, it, expect, beforeEach } from "vitest";
import { GameManager } from "../../game/GameManager.js";
import { GamePhase } from "../../game/types.js";

describe("Game Flow Integration Tests", () => {
  let gameManager: GameManager;
  let player1Id: string;
  let player2Id: string;
  let player3Id: string;

  beforeEach(() => {
    gameManager = new GameManager();
    player1Id = "player1";
    player2Id = "player2";
    player3Id = "player3";
  });

  describe("Complete Game Cycle", () => {
    it("should complete a full game from join to end", () => {
      // 1. DECK_BUILDING: Players join
      const p1 = gameManager.addPlayer("Alice", player1Id);
      const p2 = gameManager.addPlayer("Bob", player2Id);
      const p3 = gameManager.addPlayer("Carol", player3Id);

      expect(p1.isAdmin).toBe(true);
      expect(p2.isAdmin).toBe(false);
      expect(p3.isAdmin).toBe(false);

      // 2. Upload images (need 100 minimum, admin can upload unlimited)
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,test${i}`, player1Id);
      }

      const roomState = gameManager.getRoomState();
      expect(roomState.deckSize).toBeGreaterThanOrEqual(100);

      // 3. Start game
      gameManager.startGame(player1Id);
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.STORYTELLER_CHOICE);

      // 4. Get player states
      const p1State = gameManager.getPlayerState(player1Id);
      const p2State = gameManager.getPlayerState(player2Id);
      const p3State = gameManager.getPlayerState(player3Id);

      expect(p1State?.hand.length).toBe(6);
      expect(p2State?.hand.length).toBe(6);
      expect(p3State?.hand.length).toBe(6);

      // 5. Storyteller submits - get fresh room state after game start
      const updatedRoomState = gameManager.getRoomState();
      const storytellerId = updatedRoomState.storytellerId!;
      const storytellerState = gameManager.getPlayerState(storytellerId)!;
      const cardId = storytellerState.hand[0].id;

      gameManager.storytellerSubmitCard(
        storytellerId,
        cardId,
        "Beautiful sunset"
      );
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.PLAYERS_CHOICE);

      // 6. Other players submit
      const otherPlayers = [player1Id, player2Id, player3Id].filter(
        (id) => id !== storytellerId
      );

      for (const playerId of otherPlayers) {
        const playerState = gameManager.getPlayerState(playerId)!;
        const cardToSubmit = playerState.hand[0].id;
        gameManager.playerSubmitCard(playerId, cardToSubmit);
      }

      expect(gameManager.getCurrentPhase()).toBe(GamePhase.VOTING);

      // 7. Players vote
      const votingRoomState = gameManager.getRoomState();
      const revealedCards = votingRoomState.revealedCards;

      for (const playerId of otherPlayers) {
        // Vote for a random card that's not their own
        const playerState = gameManager.getPlayerState(playerId)!;
        const myCardId = playerState.mySubmittedCardId;
        const cardsToVoteFor = revealedCards.filter(
          (c: { cardId: string }) => c.cardId !== myCardId
        );

        if (cardsToVoteFor.length > 0) {
          gameManager.playerVote(playerId, cardsToVoteFor[0].cardId);
        }
      }

      expect(gameManager.getCurrentPhase()).toBe(GamePhase.REVEAL);

      // 8. Verify scores were calculated
      const finalRoomState = gameManager.getRoomState();
      expect(finalRoomState.lastScoreDeltas.length).toBeGreaterThan(0);

      // 9. Advance to next round
      gameManager.advanceToNextRound(player1Id);

      // Should either start next round or end game
      const phase = gameManager.getCurrentPhase();
      expect([GamePhase.STORYTELLER_CHOICE, GamePhase.GAME_END]).toContain(
        phase
      );
    });

    it("should handle player disconnection gracefully", () => {
      // Add players
      gameManager.addPlayer("Alice", player1Id);
      gameManager.addPlayer("Bob", player2Id);
      gameManager.addPlayer("Carol", player3Id);

      // Upload images
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,test${i}`, player1Id);
      }

      // Start game
      gameManager.startGame(player1Id);

      // Disconnect player
      gameManager.removePlayer(player2Id);

      const roomState = gameManager.getRoomState();
      const bob = roomState.players.find(
        (p: { id: string }) => p.id === player2Id
      );

      expect(bob?.isConnected).toBe(false);

      // Reconnect
      gameManager.reconnectPlayer(player2Id);

      const updatedRoomState = gameManager.getRoomState();
      const reconnectedBob = updatedRoomState.players.find(
        (p: { id: string }) => p.id === player2Id
      );

      expect(reconnectedBob?.isConnected).toBe(true);
    });

    it("should handle admin transfer when admin leaves", () => {
      const p1 = gameManager.addPlayer("Alice", player1Id);
      const p2 = gameManager.addPlayer("Bob", player2Id);

      expect(p1.isAdmin).toBe(true);
      expect(p2.isAdmin).toBe(false);

      // Admin leaves
      gameManager.leavePlayer(player1Id);

      const roomState = gameManager.getRoomState();
      const bob = roomState.players.find(
        (p: { id: string }) => p.id === player2Id
      );

      expect(bob?.isAdmin).toBe(true);
    });

    it("should enforce player count minimum", () => {
      gameManager.addPlayer("Alice", player1Id);
      gameManager.addPlayer("Bob", player2Id);

      // Upload images
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,test${i}`, player1Id);
      }

      // Should fail with only 2 players
      expect(() => {
        gameManager.startGame(player1Id);
      }).toThrow();
    });

    it("should enforce deck size minimum", () => {
      gameManager.addPlayer("Alice", player1Id);
      gameManager.addPlayer("Bob", player2Id);
      gameManager.addPlayer("Carol", player3Id);

      // Only upload 50 images (need 90 for 3 players, 30 point target)
      for (let i = 0; i < 50; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,test${i}`, player1Id);
      }

      // Should fail without enough images (3 × (6 + 30/2) × 1.3 = 81.9 → 90 minimum)
      expect(() => gameManager.startGame(player1Id)).toThrow(
        "Need at least 90 images"
      );

      // Upload more images to reach minimum (50 + 50 = 100, enough for game)
      for (let i = 50; i < 100; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,test${i}`, player1Id);
      }

      // Now should succeed
      gameManager.startGame(player1Id);

      const roomState = gameManager.getRoomState();
      expect(roomState.phase).toBe("STORYTELLER_CHOICE");
    });
  });

  describe("Phase Transitions", () => {
    beforeEach(() => {
      // Set up game
      gameManager.addPlayer("Alice", player1Id);
      gameManager.addPlayer("Bob", player2Id);
      gameManager.addPlayer("Carol", player3Id);

      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,test${i}`, player1Id);
      }

      gameManager.startGame(player1Id);
    });

    it("should prevent invalid phase transitions", () => {
      // Cannot advance round from STORYTELLER_CHOICE
      expect(() => {
        gameManager.advanceToNextRound(player1Id);
      }).toThrow();
    });

    it("should prevent non-admin from starting game", () => {
      const newGameManager = new GameManager();
      newGameManager.addPlayer("Alice", player1Id);
      newGameManager.addPlayer("Bob", player2Id);
      newGameManager.addPlayer("Carol", player3Id);

      for (let i = 0; i < 100; i++) {
        newGameManager.uploadImage(
          `data:image/jpeg;base64,test${i}`,
          player1Id
        );
      }

      // Bob tries to start (not admin)
      expect(() => {
        newGameManager.startGame(player2Id);
      }).toThrow();
    });
  });

  describe("Memory and Cleanup", () => {
    it("should clean up disconnected players after timeout", async () => {
      gameManager.addPlayer("Alice", player1Id);
      gameManager.addPlayer("Bob", player2Id);
      gameManager.addPlayer("Carol", player3Id);

      // Disconnect player
      gameManager.removePlayer(player2Id);

      // Get the player object and manually set lastSeen to past (for testing)
      const players = (gameManager as any).state.players;
      const bobPlayer = players.get(player2Id);
      if (bobPlayer) {
        bobPlayer.lastSeen = Date.now() - 60 * 60 * 1000; // 1 hour ago
      }

      // Clean up with 0ms timeout (immediate)
      const cleanedCount = gameManager.cleanupDisconnectedPlayers(0);

      expect(cleanedCount).toBe(1);

      const roomState = gameManager.getRoomState();
      expect(
        roomState.players.find((p: { id: string }) => p.id === player2Id)
      ).toBeUndefined();
    });

    it("should transfer images when player is kicked", () => {
      gameManager.addPlayer("Alice", player1Id);
      gameManager.addPlayer("Bob", player2Id);

      // Bob uploads images
      for (let i = 0; i < 20; i++) {
        gameManager.uploadImage(`data:image/jpeg;base64,bob${i}`, player2Id);
      }

      const beforeKick = gameManager.getRoomState();
      const bobImageCount = beforeKick.deckImages.filter(
        (img: { uploadedBy: string }) => img.uploadedBy === player2Id
      ).length;

      expect(bobImageCount).toBe(20);

      // Kick Bob
      gameManager.kickPlayer(player1Id, player2Id);

      const afterKick = gameManager.getRoomState();
      const transferredImages = afterKick.deckImages.filter(
        (img: { uploadedBy: string }) => img.uploadedBy === player1Id
      ).length;

      // Images should be transferred to admin
      expect(transferredImages).toBeGreaterThanOrEqual(20);
    });
  });
});
