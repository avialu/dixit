import { ScoreResult, SubmittedCard, Vote } from './types.js';

export class ScoringEngine {
  /**
   * Calculate scores according to Dixit rules:
   * - If all or none guessed storyteller's card:
   *   - Storyteller: 0 points
   *   - Others: +2 points each
   * - Otherwise:
   *   - Storyteller: +3 points
   *   - Each correct guesser: +3 points
   * - Additionally:
   *   - Each non-storyteller gets +1 per vote their card received
   */
  static calculateScores(
    storytellerId: string,
    storytellerCardId: string,
    submittedCards: SubmittedCard[],
    votes: Vote[]
  ): ScoreResult[] {
    const results: ScoreResult[] = [];
    
    // Get all non-storyteller player IDs
    const nonStorytellers = submittedCards
      .filter(sc => sc.playerId !== storytellerId)
      .map(sc => sc.playerId);
    
    // Count votes for storyteller's card
    const votesForStoryteller = votes.filter(v => v.cardId === storytellerCardId);
    const correctGuesses = votesForStoryteller.length;
    const totalVoters = nonStorytellers.length;

    // Check if all or none guessed correctly
    const allGuessed = correctGuesses === totalVoters && totalVoters > 0;
    const noneGuessed = correctGuesses === 0;

    if (allGuessed || noneGuessed) {
      // Storyteller gets 0
      results.push({
        playerId: storytellerId,
        delta: 0,
        reason: allGuessed 
          ? 'Storyteller: All guessed (too obvious)' 
          : 'Storyteller: None guessed (too obscure)',
      });

      // All others get +2
      for (const playerId of nonStorytellers) {
        results.push({
          playerId,
          delta: 2,
          reason: allGuessed ? 'Too obvious' : 'Too obscure',
        });
      }
    } else {
      // Storyteller gets +3
      results.push({
        playerId: storytellerId,
        delta: 3,
        reason: 'Storyteller: Some guessed correctly',
      });

      // Each correct guesser gets +3
      for (const vote of votesForStoryteller) {
        results.push({
          playerId: vote.voterId,
          delta: 3,
          reason: 'Guessed storyteller\'s card',
        });
      }
    }

    // Count votes for each non-storyteller's card
    const votesByCard = new Map<string, number>();
    for (const vote of votes) {
      if (vote.cardId !== storytellerCardId) {
        votesByCard.set(vote.cardId, (votesByCard.get(vote.cardId) || 0) + 1);
      }
    }

    // Award +1 per vote received for non-storytellers
    for (const submittedCard of submittedCards) {
      if (submittedCard.playerId !== storytellerId) {
        const votesReceived = votesByCard.get(submittedCard.cardId) || 0;
        if (votesReceived > 0) {
          results.push({
            playerId: submittedCard.playerId,
            delta: votesReceived,
            reason: `Received ${votesReceived} vote(s) for your card`,
          });
        }
      }
    }

    return results;
  }

  /**
   * Aggregate score results by player ID
   */
  static aggregateScores(results: ScoreResult[]): Map<string, number> {
    const aggregated = new Map<string, number>();
    
    for (const result of results) {
      const current = aggregated.get(result.playerId) || 0;
      aggregated.set(result.playerId, current + result.delta);
    }

    return aggregated;
  }
}

