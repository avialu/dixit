import { describe, it, expect, beforeEach } from 'vitest';
import { GameManager } from '../game/GameManager.js';
import { GamePhase } from '../game/types.js';

describe('GameManager', () => {
  let gameManager: GameManager;
  const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    gameManager = new GameManager();
  });

  describe('Player Management', () => {
    it('should start in DECK_BUILDING phase', () => {
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.DECK_BUILDING);
    });

    it('should add first player as admin', () => {
      const player = gameManager.addPlayer('Alice', 'client-1');
      expect(player.isAdmin).toBe(true);
      expect(player.name).toBe('Alice');
    });

    it('should add subsequent players as non-admin', () => {
      gameManager.addPlayer('Alice', 'client-1');
      const player2 = gameManager.addPlayer('Bob', 'client-2');
      expect(player2.isAdmin).toBe(false);
    });

    it('should remain in DECK_BUILDING when players join', () => {
      gameManager.addPlayer('Alice', 'client-1');
      gameManager.addPlayer('Bob', 'client-2');
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.DECK_BUILDING);
      
      gameManager.addPlayer('Charlie', 'client-3');
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.DECK_BUILDING);
    });

    it('should handle player reconnection', () => {
      const player = gameManager.addPlayer('Alice', 'client-1');
      gameManager.removePlayer('client-1');
      expect(player.isConnected).toBe(false);
      
      gameManager.reconnectPlayer('client-1');
      expect(player.isConnected).toBe(true);
    });
  });

  describe('Deck Management', () => {
    beforeEach(() => {
      gameManager.addPlayer('Alice', 'admin');
      gameManager.addPlayer('Bob', 'player1');
      gameManager.addPlayer('Charlie', 'player2');
    });

    it('should allow uploading images', () => {
      const card = gameManager.uploadImage(mockImage, 'player1');
      expect(card.uploadedBy).toBe('player1');
    });

    it('should allow admin to toggle player uploads', () => {
      gameManager.setAllowPlayerUploads(false, 'admin');
      const roomState = gameManager.getRoomState();
      expect(roomState.allowPlayerUploads).toBe(false);
    });

    it('should not allow non-admin to toggle player uploads', () => {
      expect(() => gameManager.setAllowPlayerUploads(false, 'player1'))
        .toThrow('Admin privileges');
    });

    it('should allow admin to lock deck', () => {
      gameManager.lockDeck('admin');
      const roomState = gameManager.getRoomState();
      expect(roomState.deckLocked).toBe(true);
    });
  });

  describe('Game Start', () => {
    beforeEach(() => {
      gameManager.addPlayer('Alice', 'admin');
      gameManager.addPlayer('Bob', 'player1');
      gameManager.addPlayer('Charlie', 'player2');
    });

    it('should not start without minimum images', () => {
      expect(() => gameManager.startGame('admin')).toThrow('at least 100 images');
    });

    it('should start game with sufficient images', () => {
      // Add 100 images
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(mockImage, `player${i % 2 + 1}`);
      }

      gameManager.startGame('admin');
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.STORYTELLER_CHOICE);
      
      const roomState = gameManager.getRoomState();
      expect(roomState.currentRound).toBe(1);
      expect(roomState.storytellerId).toBe('admin');
      expect(roomState.deckLocked).toBe(true);
    });

    it('should deal 6 cards to each player', () => {
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(mockImage, `player${i % 2 + 1}`);
      }

      gameManager.startGame('admin');
      
      const player1State = gameManager.getPlayerState('admin');
      const player2State = gameManager.getPlayerState('player1');
      const player3State = gameManager.getPlayerState('player2');

      expect(player1State?.hand.length).toBe(6);
      expect(player2State?.hand.length).toBe(6);
      expect(player3State?.hand.length).toBe(6);
    });
  });

  describe('Storyteller Phase', () => {
    beforeEach(() => {
      gameManager.addPlayer('Alice', 'admin');
      gameManager.addPlayer('Bob', 'player1');
      gameManager.addPlayer('Charlie', 'player2');
      
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(mockImage, `player${i % 2 + 1}`);
      }
      gameManager.startGame('admin');
    });

    it('should allow storyteller to submit card', () => {
      const playerState = gameManager.getPlayerState('admin');
      const cardId = playerState!.hand[0].id;

      gameManager.storytellerSubmitCard('admin', cardId, 'A mysterious forest');
      
      expect(gameManager.getCurrentPhase()).toBe(GamePhase.PLAYERS_CHOICE);
      const roomState = gameManager.getRoomState();
      expect(roomState.currentClue).toBe('A mysterious forest');
    });

    it('should not allow non-storyteller to submit', () => {
      const playerState = gameManager.getPlayerState('player1');
      const cardId = playerState!.hand[0].id;

      expect(() => gameManager.storytellerSubmitCard('player1', cardId, 'Test'))
        .toThrow('not the storyteller');
    });

    it('should not allow submitting card not in hand', () => {
      expect(() => gameManager.storytellerSubmitCard('admin', 'fake-card-id', 'Test'))
        .toThrow('do not have that card');
    });
  });

  describe('Player Choice Phase', () => {
    beforeEach(() => {
      gameManager.addPlayer('Alice', 'admin');
      gameManager.addPlayer('Bob', 'player1');
      gameManager.addPlayer('Charlie', 'player2');
      
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(mockImage, `player${i % 2 + 1}`);
      }
      gameManager.startGame('admin');

      const storytellerState = gameManager.getPlayerState('admin');
      gameManager.storytellerSubmitCard('admin', storytellerState!.hand[0].id, 'Clue');
    });

    it('should allow players to submit cards', () => {
      const player1State = gameManager.getPlayerState('player1');
      gameManager.playerSubmitCard('player1', player1State!.hand[0].id);

      const playerState = gameManager.getPlayerState('player1');
      expect(playerState!.mySubmittedCardId).toBeTruthy();
    });

    it('should not allow storyteller to submit another card', () => {
      const adminState = gameManager.getPlayerState('admin');
      expect(() => gameManager.playerSubmitCard('admin', adminState!.hand[0].id))
        .toThrow('Storyteller cannot');
    });

    it('should transition to REVEAL when all players submit', () => {
      const player1State = gameManager.getPlayerState('player1');
      const player2State = gameManager.getPlayerState('player2');

      gameManager.playerSubmitCard('player1', player1State!.hand[0].id);
      gameManager.playerSubmitCard('player2', player2State!.hand[0].id);

      // Should auto-transition to REVEAL (then quickly to VOTING)
      setTimeout(() => {
        const phase = gameManager.getCurrentPhase();
        expect([GamePhase.REVEAL, GamePhase.VOTING]).toContain(phase);
      }, 200);
    });
  });

  describe('Voting Phase', () => {
    beforeEach(async () => {
      gameManager.addPlayer('Alice', 'admin');
      gameManager.addPlayer('Bob', 'player1');
      gameManager.addPlayer('Charlie', 'player2');
      
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(mockImage, `player${i % 2 + 1}`);
      }
      gameManager.startGame('admin');

      const storytellerState = gameManager.getPlayerState('admin');
      gameManager.storytellerSubmitCard('admin', storytellerState!.hand[0].id, 'Clue');

      const player1State = gameManager.getPlayerState('player1');
      const player2State = gameManager.getPlayerState('player2');
      gameManager.playerSubmitCard('player1', player1State!.hand[0].id);
      gameManager.playerSubmitCard('player2', player2State!.hand[0].id);

      // Wait for auto-transition to voting
      await new Promise(resolve => setTimeout(resolve, 200));
    });

    it('should allow players to vote', () => {
      const submittedCards = gameManager.getSubmittedCards();
      const cardToVoteFor = submittedCards[0].cardId;

      // Find a non-storyteller who didn't submit this card
      const voter = submittedCards.find(sc => 
        sc.playerId !== 'admin' && sc.cardId !== cardToVoteFor
      )?.playerId || 'player1';

      gameManager.playerVote(voter, cardToVoteFor);
      
      const playerState = gameManager.getPlayerState(voter);
      expect(playerState!.myVote).toBe(cardToVoteFor);
    });

    it('should not allow voting for own card', () => {
      const submittedCards = gameManager.getSubmittedCards();
      const player1Card = submittedCards.find(sc => sc.playerId === 'player1');

      expect(() => gameManager.playerVote('player1', player1Card!.cardId))
        .toThrow('Cannot vote for your own card');
    });

    it('should not allow storyteller to vote', () => {
      const submittedCards = gameManager.getSubmittedCards();
      expect(() => gameManager.playerVote('admin', submittedCards[0].cardId))
        .toThrow('Storyteller cannot vote');
    });
  });

  describe('Reset and New Deck', () => {
    beforeEach(() => {
      gameManager.addPlayer('Alice', 'admin');
      gameManager.addPlayer('Bob', 'player1');
      gameManager.addPlayer('Charlie', 'player2');
    });

    it('should reset game but keep deck', () => {
      for (let i = 0; i < 100; i++) {
        gameManager.uploadImage(mockImage, 'player1');
      }

      gameManager.startGame('admin');
      gameManager.resetGame('admin');

      expect(gameManager.getCurrentPhase()).toBe(GamePhase.DECK_BUILDING);
      
      const roomState = gameManager.getRoomState();
      expect(roomState.currentRound).toBe(0);
      expect(roomState.players.every(p => p.score === 0)).toBe(true);
    });

    it('should clear everything with new deck', () => {
      for (let i = 0; i < 50; i++) {
        gameManager.uploadImage(mockImage, 'player1');
      }

      gameManager.newDeck('admin');

      const roomState = gameManager.getRoomState();
      expect(roomState.deckSize).toBe(0);
      expect(roomState.deckImages.length).toBe(0);
      expect(roomState.allowPlayerUploads).toBe(true);
    });
  });
});

