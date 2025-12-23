import { Card, Player as IPlayer } from './types.js';

export class Player implements IPlayer {
  id: string;
  name: string;
  isAdmin: boolean;
  isConnected: boolean;
  hand: Card[];
  score: number;
  tokenImage: string | null;
  lastSeen: number; // Timestamp for cleanup

  constructor(id: string, name: string, isAdmin: boolean = false) {
    this.id = id;
    this.name = name;
    this.isAdmin = isAdmin;
    this.isConnected = true;
    this.hand = [];
    this.score = 0;
    this.tokenImage = null;
    this.lastSeen = Date.now();
  }

  addCards(cards: Card[]): void {
    this.hand.push(...cards);
  }

  removeCard(cardId: string): Card | null {
    const index = this.hand.findIndex(c => c.id === cardId);
    if (index === -1) return null;
    
    const [card] = this.hand.splice(index, 1);
    return card;
  }

  hasCard(cardId: string): boolean {
    return this.hand.some(c => c.id === cardId);
  }

  addScore(points: number): void {
    this.score += points;
  }

  disconnect(): void {
    this.isConnected = false;
    this.lastSeen = Date.now();
  }

  reconnect(): void {
    this.isConnected = true;
    this.lastSeen = Date.now();
  }

  setTokenImage(imageData: string | null): void {
    this.tokenImage = imageData;
  }
}

