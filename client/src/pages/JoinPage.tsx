import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Socket } from 'socket.io-client';

interface JoinPageProps {
  socket: Socket | null;
  clientId: string;
  onJoin: (name: string, clientId: string) => void;
}

export function JoinPage({ socket, clientId, onJoin }: JoinPageProps) {
  const [name, setName] = useState('');
  const [joining, setJoining] = useState(false);
  const [socketReady, setSocketReady] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!socket) return;

    const handleConnect = () => {
      console.log('Socket connected on join page');
      setSocketReady(true);
    };

    const handleJoinSuccess = () => {
      console.log('Join success!');
      setJoining(false);
      navigate('/lobby');
    };

    const handleError = (error: any) => {
      console.error('Join error:', error);
      setJoining(false);
      alert('Error: ' + error.message);
    };

    if (socket.connected) {
      setSocketReady(true);
    }

    socket.on('connect', handleConnect);
    socket.on('joinSuccess', handleJoinSuccess);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('joinSuccess', handleJoinSuccess);
      socket.off('error', handleError);
    };
  }, [socket, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !joining && socketReady) {
      setJoining(true);
      console.log('Submitting join with:', { name: name.trim(), clientId });
      onJoin(name.trim(), clientId);
    }
  };

  return (
    <div className="join-page">
      <div className="join-container">
        <h1>🎨 DIXIT</h1>
        <p>Local Multiplayer Card Game</p>
        
        {!socketReady && (
          <p style={{ color: '#f39c12' }}>Connecting to server...</p>
        )}
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            autoFocus
            disabled={joining || !socketReady}
          />
          <button type="submit" disabled={!name.trim() || joining || !socketReady}>
            {!socketReady ? 'Connecting...' : joining ? 'Joining...' : 'Join Game'}
          </button>
        </form>
      </div>
    </div>
  );
}

