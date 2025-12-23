import { nanoid } from 'nanoid';
import { Card } from './types.js';
import { loadDefaultImages } from '../utils/defaultImages.js';
import { GAME_CONSTANTS } from './constants.js';
import { logger } from '../utils/logger.js';

export class DeckManager {
  private deck: Card[] = [];
  private allowPlayerUploads: boolean = true; // Players can upload by default
  private locked: boolean = false;
  private adminId: string;
  private imageCountByPlayer: Map<string, number> = new Map();

  constructor(adminId: string) {
    this.adminId = adminId;
  }

  setAllowPlayerUploads(allow: boolean): void {
    if (this.locked) {
      throw new Error('Cannot change upload settings: deck is locked');
    }
    this.allowPlayerUploads = allow;
  }

  getAllowPlayerUploads(): boolean {
    return this.allowPlayerUploads;
  }

  isLocked(): boolean {
    return this.locked;
  }

  lock(): void {
    this.locked = true;
  }

  unlock(): void {
    this.locked = false;
  }

  canStartGame(): boolean {
    return this.deck.length >= GAME_CONSTANTS.MIN_IMAGES_TO_START;
  }

  getDeckSize(): number {
    return this.deck.length;
  }

  getAllCards(): Card[] {
    return [...this.deck];
  }

  addImage(imageData: string, playerId: string): Card {
    if (this.locked) {
      throw new Error('Cannot add image: deck is locked');
    }

    // Validate image format (must be a valid data URL for image)
    if (!imageData.startsWith('data:image/')) {
      throw new Error('Invalid image format: must be a valid image data URL');
    }

    // Validate specific image types (JPEG, PNG, WebP, GIF)
    const validTypes = [
      'data:image/jpeg',
      'data:image/jpg',
      'data:image/png',
      'data:image/webp',
      'data:image/gif',
    ];
    if (!validTypes.some(type => imageData.startsWith(type))) {
      throw new Error('Invalid image type: only JPEG, PNG, WebP, and GIF are supported');
    }

    // Validate base64 size (rough estimate)
    const sizeInBytes = (imageData.length * 3) / 4;
    if (sizeInBytes > GAME_CONSTANTS.MAX_IMAGE_SIZE) {
      throw new Error(`Image too large: ${Math.round(sizeInBytes / 1024 / 1024)}MB (max ${Math.round(GAME_CONSTANTS.MAX_IMAGE_SIZE / 1024 / 1024)}MB)`);
    }

    // Check upload permissions
    const isAdmin = playerId === this.adminId;
    if (!isAdmin && !this.allowPlayerUploads) {
      throw new Error('Only the host can upload images');
    }

    // Check per-player limit (admins have unlimited uploads)
    const currentCount = this.imageCountByPlayer.get(playerId) || 0;
    if (!isAdmin && currentCount >= GAME_CONSTANTS.MAX_IMAGES_PER_PLAYER) {
      throw new Error(`Maximum ${GAME_CONSTANTS.MAX_IMAGES_PER_PLAYER} images per player`);
    }

    const card: Card = {
      id: nanoid(),
      imageData,
      uploadedBy: playerId,
    };

    this.deck.push(card);
    this.imageCountByPlayer.set(playerId, currentCount + 1);

    return card;
  }

  deleteImage(cardId: string, playerId: string): boolean {
    if (this.locked) {
      throw new Error('Cannot delete image: deck is locked');
    }

    const cardIndex = this.deck.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      return false;
    }

    const card = this.deck[cardIndex];
    const isAdmin = playerId === this.adminId;

    // Only owner or admin can delete
    if (card.uploadedBy !== playerId && !isAdmin) {
      throw new Error('You can only delete your own images');
    }

    this.deck.splice(cardIndex, 1);
    
    const currentCount = this.imageCountByPlayer.get(card.uploadedBy) || 0;
    this.imageCountByPlayer.set(card.uploadedBy, Math.max(0, currentCount - 1));

    return true;
  }

  drawCards(count: number): Card[] {
    if (count > this.deck.length) {
      throw new Error(`Cannot draw ${count} cards: only ${this.deck.length} remaining`);
    }

    const drawn = this.deck.splice(0, count);
    return drawn;
  }

  /**
   * Return cards to the deck
   * Used when a player leaves before the game starts
   */
  returnCards(cards: Card[]): void {
    this.deck.push(...cards);
    logger.debug("Returned cards to deck", { 
      returnedCount: cards.length, 
      deckSize: this.deck.length 
    });
  }

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  reset(): void {
    // Just unlock the deck, keep all uploaded images
    this.locked = false;
    // Note: deck and imageCountByPlayer are preserved on reset
    // Note: allowPlayerUploads is preserved on reset
  }

  clearAll(): void {
    this.deck = [];
    this.locked = false;
    this.allowPlayerUploads = true;
    this.imageCountByPlayer.clear();
  }

  /**
   * Remove all images uploaded by a specific player
   * Used when a player leaves/disconnects
   */
  removePlayerImages(playerId: string): number {
    const initialCount = this.deck.length;
    
    // Get all images from this player (for logging)
    const playerImages = this.deck.filter(card => card.uploadedBy === playerId);
    
    // Log images being removed
    if (playerImages.length > 0) {
      logger.debug("Removing player images", { 
        playerId, 
        imageCount: playerImages.length 
      });
    }
    
    // Remove the images
    this.deck = this.deck.filter(card => card.uploadedBy !== playerId);
    const removedCount = initialCount - this.deck.length;
    
    // Reset the player's image count
    this.imageCountByPlayer.delete(playerId);
    
    return removedCount;
  }

  /**
   * Transfer all images from one player to another
   * Used when a player is kicked or leaves
   */
  transferImages(fromPlayerId: string, toPlayerId: string): number {
    let transferredCount = 0;
    
    // Update ownership of all images from the source player
    this.deck.forEach(card => {
      if (card.uploadedBy === fromPlayerId) {
        card.uploadedBy = toPlayerId;
        transferredCount++;
      }
    });
    
    // Update image counts
    const fromCount = this.imageCountByPlayer.get(fromPlayerId) || 0;
    const toCount = this.imageCountByPlayer.get(toPlayerId) || 0;
    
    this.imageCountByPlayer.delete(fromPlayerId);
    this.imageCountByPlayer.set(toPlayerId, toCount + fromCount);
    
    if (transferredCount > 0) {
      logger.debug("Transferred images between players", { 
        fromPlayerId, 
        toPlayerId, 
        transferredCount 
      });
    }
    
    return transferredCount;
  }

  /**
   * Load default images into the deck
   * Used when there aren't enough uploaded images
   */
  loadDefaultImages(): void {
    const defaultImages = loadDefaultImages();
    
    for (const imageData of defaultImages) {
      const card: Card = {
        id: nanoid(),
        imageData,
        uploadedBy: 'system', // Mark as system-provided
      };
      this.deck.push(card);
    }
    
    logger.info("Added default images to deck", { 
      defaultImagesCount: defaultImages.length, 
      totalDeckSize: this.deck.length 
    });
  }
}

