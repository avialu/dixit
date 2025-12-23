import { Player } from '../hooks/useGameState';
import { Button, Badge } from './ui';

interface PlayerListProps {
  players: Player[];
  storytellerId?: string | null;
  currentPlayerId?: string;
  isAdmin?: boolean;
  showScores?: boolean;
  onKickPlayer?: (playerId: string) => void;
  onPromotePlayer?: (playerId: string) => void;
}

export function PlayerList({ 
  players, 
  storytellerId,
  currentPlayerId,
  isAdmin = false,
  showScores = true,
  onKickPlayer,
  onPromotePlayer,
}: PlayerListProps) {
  return (
    <div className="player-list">
      <h3>Players ({players.length})</h3>
      <ul>
        {players.map((player) => (
          <li key={player.id} className={!player.isConnected ? 'disconnected' : ''}>
            <div className="player-list-row">
              <div className="player-info">
                <span className="player-name">
                  {player.name}
                  {player.isAdmin && <Badge variant="admin" />}
                  {storytellerId === player.id && <Badge variant="storyteller" />}
                  {currentPlayerId === player.id && <Badge variant="you" />}
                </span>
                {showScores && <span className="player-score"> {player.score} pts</span>}
                {!player.isConnected && ' (disconnected)'}
              </div>
              {isAdmin && player.id !== currentPlayerId && (
                <div className="player-actions">
                  {!player.isAdmin && onPromotePlayer && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => onPromotePlayer(player.id)}
                      title="Promote to Admin"
                    >
                      Promote
                    </Button>
                  )}
                  {onKickPlayer && (
                    <Button
                      variant="danger"
                      size="small"
                      onClick={() => onKickPlayer(player.id)}
                      title="Kick player from game"
                    >
                      Kick
                    </Button>
                  )}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

