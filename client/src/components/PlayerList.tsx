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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ flex: 1 }}>
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
                <div style={{ display: 'flex', gap: '4px' }}>
                  {!player.isAdmin && onPromotePlayer && (
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={() => onPromotePlayer(player.id)}
                      style={{ padding: '4px 8px', fontSize: '12px' }}
                      title="Promote to Admin"
                    >
                      Promote
                    </Button>
                  )}
                  {onKickPlayer && (
                    <Button
                      onClick={() => onKickPlayer(player.id)}
                      className="btn-danger btn-small"
                      style={{ padding: '4px 8px', fontSize: '12px' }}
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

