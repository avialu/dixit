import { useNavigate } from 'react-router-dom';
import { RoomState } from '../hooks/useGameState';
import { PlayerList } from '../components/PlayerList';
import { DeckUploader } from '../components/DeckUploader';
import { QRCode } from '../components/QRCode';
import { useEffect } from 'react';

interface LobbyPageProps {
  roomState: RoomState | null;
  playerId: string;
  onUploadImage: (imageData: string) => void;
  onDeleteImage: (imageId: string) => void;
  onSetDeckMode: (mode: string) => void;
  onLockDeck: () => void;
  onStartGame: () => void;
}

export function LobbyPage({
  roomState,
  playerId,
  onUploadImage,
  onDeleteImage,
  onSetDeckMode,
  onLockDeck,
  onStartGame,
}: LobbyPageProps) {
  const navigate = useNavigate();

  useEffect(() => {
    if (roomState?.phase === 'STORYTELLER_CHOICE') {
      navigate('/game');
    }
  }, [roomState?.phase, navigate]);

  if (!roomState) {
    return <div className="loading">Loading...</div>;
  }

  const isAdmin = roomState.players.find(p => p.id === playerId)?.isAdmin || false;
  const canStart = roomState.deckSize >= 100 && roomState.players.length >= 3;
  // Use server URL (LAN IP) for QR code, fallback to current location
  const joinUrl = roomState.serverUrl || window.location.origin;

  return (
    <div className="lobby-page">
      <h1>Game Lobby</h1>
      
      <div className="phase-indicator">
        Phase: {roomState.phase.replace(/_/g, ' ')}
      </div>

      <div className="lobby-content">
        <div className="lobby-left">
          <PlayerList players={roomState.players} />

          {isAdmin && (
            <div className="admin-controls">
              <h3>Admin Controls</h3>
              <button
                onClick={onStartGame}
                disabled={!canStart}
                className="btn-primary btn-large"
              >
                {canStart ? 'Start Game' : `Need ${100 - roomState.deckSize} more images`}
              </button>
              {roomState.players.length < 3 && (
                <p className="warning">Need at least 3 players</p>
              )}
            </div>
          )}
        </div>

        <div className="lobby-center">
          <DeckUploader
            roomState={roomState}
            playerId={playerId}
            onUpload={onUploadImage}
            onDelete={onDeleteImage}
            onSetMode={onSetDeckMode}
            onLock={onLockDeck}
          />
        </div>

        <div className="lobby-right">
          <div className="join-info">
            <h3>Players Join Here:</h3>
            <div className="qr-code">
              <QRCode url={joinUrl} size={180} />
            </div>
            <div className="join-url">{joinUrl}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

