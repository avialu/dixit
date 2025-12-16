import { nanoid } from 'nanoid';
import { Card, DeckMode } from './types.js';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES_PER_PLAYER = 20;
const MIN_IMAGES_TO_START = 100;

export class DeckManager {
  private deck: Card[] = [];
  private mode: DeckMode = DeckMode.MIXED;
  private locked: boolean = false;
  private adminId: string;
  private imageCountByPlayer: Map<string, number> = new Map();

  constructor(adminId: string) {
    this.adminId = adminId;
  }

  setMode(mode: DeckMode): void {
    if (this.locked) {
      throw new Error('Cannot change deck mode: deck is locked');
    }
    this.mode = mode;
  }

  getMode(): DeckMode {
    return this.mode;
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

    // Check deck mode restrictions
    const isAdmin = playerId === this.adminId;
    if (this.mode === DeckMode.HOST_ONLY && !isAdmin) {
      throw new Error('Only the host can upload images in HOST_ONLY mode');
    }
    if (this.mode === DeckMode.PLAYERS_ONLY && isAdmin) {
      throw new Error('Host cannot upload images in PLAYERS_ONLY mode');
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
    // Note: mode is preserved on reset
  }

  clearAll(): void {
    this.deck = [];
    this.locked = false;
    this.mode = DeckMode.MIXED;
    this.imageCountByPlayer.clear();
  }
}

