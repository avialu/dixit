import { nanoid } from 'nanoid';
import { Card } from './types.js';
import { loadDefaultImages } from '../utils/defaultImages.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_PLAYER = 200; // Increased from 20 to 200
const MIN_IMAGES_TO_START = 100;

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
    return this.deck.length >= MIN_IMAGES_TO_START;
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

    // Validate base64 size (rough estimate)
    const sizeInBytes = (imageData.length * 3) / 4;
    if (sizeInBytes > MAX_IMAGE_SIZE) {
      throw new Error(`Image too large: ${Math.round(sizeInBytes / 1024 / 1024)}MB (max 5MB)`);
    }

    // Check upload permissions
    const isAdmin = playerId === this.adminId;
    if (!isAdmin && !this.allowPlayerUploads) {
      throw new Error('Only the host can upload images');
    }

    // Check per-player limit
    const currentCount = this.imageCountByPlayer.get(playerId) || 0;
    if (currentCount >= MAX_IMAGES_PER_PLAYER) {
      throw new Error(`Maximum ${MAX_IMAGES_PER_PLAYER} images per player`);
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

  shuffle(): void {
    // Fisher-Yates shuffle
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  reset(): void {
    this.deck = [];
    this.locked = false;
    this.imageCountByPlayer.clear();
    // Note: allowPlayerUploads is preserved on reset
  }

  clearAll(): void {
    this.deck = [];
    this.locked = false;
    this.allowPlayerUploads = true;
    this.imageCountByPlayer.clear();
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
    
    console.log(`Added ${defaultImages.length} default images to deck. Total: ${this.deck.length}`);
  }
}

