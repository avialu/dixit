import { Player } from '../hooks/useGameState';

interface ScoreboardProps {
  players: Player[];
  storytellerId?: string | null;
  lastScoreDeltas?: { playerId: string; delta: number }[];
}

export function Scoreboard({ players, storytellerId, lastScoreDeltas }: ScoreboardProps) {
  // Sort by score descending
  const sorted = [...players].sort((a, b) => b.score - a.score);

  const getDelta = (playerId: string) => {
    return lastScoreDeltas?.find(d => d.playerId === playerId)?.delta || 0;
  };

  return (
    <div className="scoreboard">
      <h2>Scoreboard</h2>
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Player</th>
            <th>Score</th>
            <th>Last Round</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, index) => {
            const delta = getDelta(player.id);
            return (
              <tr
                key={player.id}
                className={`${storytellerId === player.id ? 'storyteller' : ''} ${!player.isConnected ? 'disconnected' : ''}`}
              >
                <td className="rank">{index + 1}</td>
                <td className="player-name">
                  {player.name}
                  {player.isAdmin && ' 👑'}
                  {storytellerId === player.id && ' 📖'}
                  {!player.isConnected && ' (DC)'}
                </td>
                <td className="score">{player.score}</td>
                <td className="delta">
                  {delta !== 0 && (
                    <span className={delta > 0 ? 'positive' : 'negative'}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

