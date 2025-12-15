import { Player } from '../hooks/useGameState';

interface PlayerListProps {
  players: Player[];
  storytellerId?: string | null;
}

export function PlayerList({ players, storytellerId }: PlayerListProps) {
  return (
    <div className="player-list">
      <h3>Players ({players.length})</h3>
      <ul>
        {players.map((player) => (
          <li key={player.id} className={!player.isConnected ? 'disconnected' : ''}>
            <span className="player-name">
              {player.name}
              {player.isAdmin && ' 👑'}
              {storytellerId === player.id && ' 📖'}
            </span>
            <span className="player-score">{player.score} pts</span>
            {!player.isConnected && ' (disconnected)'}
          </li>
        ))}
      </ul>
    </div>
  );
}

