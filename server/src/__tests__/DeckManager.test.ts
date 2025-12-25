import { describe, it, expect, beforeEach } from 'vitest';
import { DeckManager } from '../game/DeckManager.js';

describe('DeckManager', () => {
  let deckManager: DeckManager;
  const adminId = 'admin-123';
  const playerId = 'player-456';
  const mockImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  beforeEach(() => {
    deckManager = new DeckManager(adminId);
  });

  describe('Upload Permissions', () => {
    it('should default to allowing player uploads', () => {
      expect(deckManager.getAllowPlayerUploads()).toBe(true);
    });

    it('should allow changing upload permissions when not locked', () => {
      deckManager.setAllowPlayerUploads(false);
      expect(deckManager.getAllowPlayerUploads()).toBe(false);
    });

    it('should not allow changing permissions when locked', () => {
      deckManager.lock();
      expect(() => deckManager.setAllowPlayerUploads(false)).toThrow('deck is locked');
    });
  });

  describe('Image Upload', () => {
    it('should allow admin to upload when player uploads allowed', () => {
      const card = deckManager.addImage(mockImage, adminId);
      expect(card.uploadedBy).toBe(adminId);
      expect(deckManager.getDeckSize()).toBe(1);
    });

    it('should allow player to upload when player uploads allowed', () => {
      const card = deckManager.addImage(mockImage, playerId);
      expect(card.uploadedBy).toBe(playerId);
      expect(deckManager.getDeckSize()).toBe(1);
    });

    it('should only allow admin when player uploads disabled', () => {
      deckManager.setAllowPlayerUploads(false);
      
      const adminCard = deckManager.addImage(mockImage, adminId);
      expect(adminCard.uploadedBy).toBe(adminId);

      expect(() => deckManager.addImage(mockImage, playerId)).toThrow('Only the host');
    });

    it('should allow admin to upload even when player uploads disabled', () => {
      deckManager.setAllowPlayerUploads(false);
      
      const adminCard = deckManager.addImage(mockImage, adminId);
      expect(adminCard.uploadedBy).toBe(adminId);
      expect(deckManager.getDeckSize()).toBe(1);
    });

    it('should enforce per-player limit of 200 images', () => {
      for (let i = 0; i < 200; i++) {
        deckManager.addImage(mockImage, playerId);
      }
      expect(deckManager.getDeckSize()).toBe(200);

      expect(() => deckManager.addImage(mockImage, playerId)).toThrow('Maximum 200 images per player');
    });

    it('should not allow upload when locked', () => {
      deckManager.lock();
      expect(() => deckManager.addImage(mockImage, playerId)).toThrow('deck is locked');
    });

    it('should reject images over 5MB', () => {
      // Create a large base64 string (> 5MB when decoded)
      const largeImage = 'data:image/png;base64,' + 'A'.repeat(7 * 1024 * 1024);
      expect(() => deckManager.addImage(largeImage, playerId)).toThrow('Image too large');
    });
  });

  describe('Image Deletion', () => {
    it('should allow owner to delete their own image', () => {
      const card = deckManager.addImage(mockImage, playerId);
      const deleted = deckManager.deleteImage(card.id, playerId);
      expect(deleted).toBe(true);
      expect(deckManager.getDeckSize()).toBe(0);
    });

    it('should allow admin to delete any image', () => {
      const card = deckManager.addImage(mockImage, playerId);
      const deleted = deckManager.deleteImage(card.id, adminId);
      expect(deleted).toBe(true);
      expect(deckManager.getDeckSize()).toBe(0);
    });

    it('should not allow non-owner to delete image', () => {
      const card = deckManager.addImage(mockImage, adminId);
      expect(() => deckManager.deleteImage(card.id, playerId)).toThrow('only delete your own');
    });

    it('should return false for non-existent card', () => {
      const deleted = deckManager.deleteImage('fake-id', playerId);
      expect(deleted).toBe(false);
    });

    it('should not allow deletion when locked', () => {
      const card = deckManager.addImage(mockImage, playerId);
      deckManager.lock();
      expect(() => deckManager.deleteImage(card.id, playerId)).toThrow('deck is locked');
    });
  });

  describe('Game Start Validation', () => {
    it('should calculate minimum based on players and win target', () => {
      // For 3 players, 30 point target: 3 × (6 + 30/2) × 1.3 = 3 × 21 × 1.3 = 81.9 → rounds to 90
      for (let i = 0; i < 89; i++) {
        deckManager.addImage(mockImage, `player-${i % 3}`);
      }
      expect(deckManager.canStartGame(3, 30)).toBe(false);
      
      deckManager.addImage(mockImage, adminId);
      expect(deckManager.canStartGame(3, 30)).toBe(true);
    });

    it('should require more cards for more players', () => {
      // For 5 players, 30 point target: 5 × (6 + 30/2) × 1.3 = 5 × 21 × 1.3 = 136.5 → rounds to 140
      for (let i = 0; i < 139; i++) {
        deckManager.addImage(mockImage, `player-${i % 5}`);
      }
      expect(deckManager.canStartGame(5, 30)).toBe(false);
      
      deckManager.addImage(mockImage, adminId);
      expect(deckManager.canStartGame(5, 30)).toBe(true);
    });

    it('should require more cards for higher win target', () => {
      // For 3 players, 50 point target: 3 × (6 + 50/2) × 1.3 = 3 × 31 × 1.3 = 120.9 → rounds to 130
      for (let i = 0; i < 129; i++) {
        deckManager.addImage(mockImage, `player-${i % 3}`);
      }
      expect(deckManager.canStartGame(3, 50)).toBe(false);
      
      deckManager.addImage(mockImage, adminId);
      expect(deckManager.canStartGame(3, 50)).toBe(true);
    });
  });

  describe('Card Drawing', () => {
    beforeEach(() => {
      for (let i = 0; i < 50; i++) {
        deckManager.addImage(mockImage, `player-${i % 5}`);
      }
    });

    it('should draw correct number of cards', () => {
      const drawn = deckManager.drawCards(6);
      expect(drawn.length).toBe(6);
      expect(deckManager.getDeckSize()).toBe(44);
    });

    it('should not allow drawing more than available', () => {
      expect(() => deckManager.drawCards(51)).toThrow('only 50 remaining');
    });
  });

  describe('Shuffle', () => {
    it('should shuffle the deck', () => {
      const cards: string[] = [];
      for (let i = 0; i < 20; i++) {
        const card = deckManager.addImage(mockImage, playerId);
        cards.push(card.id);
      }

      const beforeShuffle = deckManager.getAllCards().map(c => c.id);
      deckManager.shuffle();
      const afterShuffle = deckManager.getAllCards().map(c => c.id);

      // Check all cards still present
      expect(afterShuffle.length).toBe(beforeShuffle.length);
      beforeShuffle.forEach(id => {
        expect(afterShuffle).toContain(id);
      });

      // Check that order changed (very unlikely to be same after shuffle)
      // Note: there's a tiny chance this could fail randomly
      expect(beforeShuffle.join(',')).not.toBe(afterShuffle.join(','));
    });
  });

  describe('Reset and Clear', () => {
    beforeEach(() => {
      deckManager.setAllowPlayerUploads(false);
      deckManager.addImage(mockImage, adminId);
      deckManager.lock();
    });

    it('should reset game state but preserve deck for replay', () => {
      // reset() should unlock and shuffle, but KEEP the uploaded images
      expect(deckManager.getDeckSize()).toBe(1); // Image was added
      expect(deckManager.isLocked()).toBe(true);
      
      deckManager.reset();
      
      expect(deckManager.getDeckSize()).toBe(1); // Image preserved!
      expect(deckManager.isLocked()).toBe(false); // Unlocked
      expect(deckManager.getAllowPlayerUploads()).toBe(false); // Setting preserved
    });

    it('should clear everything including upload settings', () => {
      deckManager.clearAll();
      expect(deckManager.getDeckSize()).toBe(0);
      expect(deckManager.isLocked()).toBe(false);
      expect(deckManager.getAllowPlayerUploads()).toBe(true);
    });
  });
});

