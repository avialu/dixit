import { describe, it, expect } from 'vitest';
import { ScoringEngine } from '../game/ScoringEngine.js';
import { SubmittedCard, Vote } from '../game/types.js';

describe('ScoringEngine', () => {
  const storytellerId = 'storyteller';
  const player1 = 'player1';
  const player2 = 'player2';
  const player3 = 'player3';

  const storytellerCard = 'card-st';
  const card1 = 'card-1';
  const card2 = 'card-2';
  const card3 = 'card-3';

  describe('All Guessed Correctly (Too Obvious)', () => {
    it('should give storyteller 0 points and others +2 when all guess correctly', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
        { cardId: card2, playerId: player2 },
        { cardId: card3, playerId: player3 },
      ];

      const votes: Vote[] = [
        { voterId: player1, cardId: storytellerCard },
        { voterId: player2, cardId: storytellerCard },
        { voterId: player3, cardId: storytellerCard },
      ];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      expect(scores.get(storytellerId)).toBe(0);
      expect(scores.get(player1)).toBe(2);
      expect(scores.get(player2)).toBe(2);
      expect(scores.get(player3)).toBe(2);
    });
  });

  describe('None Guessed Correctly (Too Obscure)', () => {
    it('should give storyteller 0 points and others +2 when none guess correctly', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
        { cardId: card2, playerId: player2 },
        { cardId: card3, playerId: player3 },
      ];

      const votes: Vote[] = [
        { voterId: player1, cardId: card2 },
        { voterId: player2, cardId: card3 },
        { voterId: player3, cardId: card1 },
      ];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      expect(scores.get(storytellerId)).toBe(0);
      expect(scores.get(player1)).toBe(2);
      expect(scores.get(player2)).toBe(2);
      expect(scores.get(player3)).toBe(2);
    });
  });

  describe('Partial Correct Guesses', () => {
    it('should give storyteller +3, correct guessers +3', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
        { cardId: card2, playerId: player2 },
        { cardId: card3, playerId: player3 },
      ];

      const votes: Vote[] = [
        { voterId: player1, cardId: storytellerCard }, // correct
        { voterId: player2, cardId: card3 },           // wrong
        { voterId: player3, cardId: storytellerCard }, // correct
      ];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      expect(scores.get(storytellerId)).toBe(3);
      expect(scores.get(player1)).toBe(3); // guessed correctly
      expect(scores.get(player3)).toBe(3); // guessed correctly
      expect(scores.get(player2)).toBeUndefined(); // didn't score
    });
  });

  describe('Vote Distribution Bonus', () => {
    it('should award +1 per vote received to non-storytellers', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
        { cardId: card2, playerId: player2 },
        { cardId: card3, playerId: player3 },
      ];

      const votes: Vote[] = [
        { voterId: player1, cardId: storytellerCard }, // correct
        { voterId: player2, cardId: card1 },           // player1's card
        { voterId: player3, cardId: card1 },           // player1's card
      ];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      expect(scores.get(storytellerId)).toBe(3); // partial correct
      expect(scores.get(player1)).toBe(5);       // 3 (correct) + 2 (votes for their card)
      expect(scores.get(player2)).toBeUndefined();
      expect(scores.get(player3)).toBeUndefined();
    });

    it('should handle complex vote distribution', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
        { cardId: card2, playerId: player2 },
        { cardId: card3, playerId: player3 },
      ];

      const votes: Vote[] = [
        { voterId: player1, cardId: card2 },           // player2's card
        { voterId: player2, cardId: card1 },           // player1's card
        { voterId: player3, cardId: card2 },           // player2's card
      ];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      // None guessed correctly
      expect(scores.get(storytellerId)).toBe(0);
      expect(scores.get(player1)).toBe(3); // 2 (too obscure) + 1 (vote from player2)
      expect(scores.get(player2)).toBe(4); // 2 (too obscure) + 2 (votes from player1 & player3)
      expect(scores.get(player3)).toBe(2); // 2 (too obscure) + 0 votes
    });
  });

  describe('Edge Cases', () => {
    it('should handle single other player (3 player game)', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
      ];

      const votes: Vote[] = [
        { voterId: player1, cardId: storytellerCard },
      ];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      // All guessed (only 1 voter)
      expect(scores.get(storytellerId)).toBe(0);
      expect(scores.get(player1)).toBe(2);
    });

    it('should handle no votes (shouldn\'t happen but defensive)', () => {
      const submitted: SubmittedCard[] = [
        { cardId: storytellerCard, playerId: storytellerId },
        { cardId: card1, playerId: player1 },
        { cardId: card2, playerId: player2 },
      ];

      const votes: Vote[] = [];

      const results = ScoringEngine.calculateScores(storytellerId, storytellerCard, submitted, votes);
      const scores = ScoringEngine.aggregateScores(results);

      // None guessed
      expect(scores.get(storytellerId)).toBe(0);
      expect(scores.get(player1)).toBe(2);
      expect(scores.get(player2)).toBe(2);
    });
  });
});

