import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
import { JoinPage } from './pages/JoinPage';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { BoardPage } from './pages/BoardPage';

function App() {
  const { socket, clientId, getClientId } = useSocket();
  const { roomState, playerState, error, actions } = useGameState(socket);

  return (
    <BrowserRouter>
      <div className="app">
        {error && (
          <div className="error-toast">
            {error}
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <JoinPage
                socket={socket}
                clientId={clientId}
                onJoin={actions.join}
              />
            }
          />
          
          <Route
            path="/lobby"
            element={
              <LobbyPage
                roomState={roomState}
                playerId={getClientId()}
                onUploadImage={actions.uploadImage}
                onDeleteImage={actions.deleteImage}
                onSetDeckMode={actions.setDeckMode}
                onLockDeck={actions.lockDeck}
                onStartGame={actions.startGame}
              />
            }
          />
          
          <Route
            path="/game"
            element={
              <GamePage
                roomState={roomState}
                playerState={playerState}
                playerId={getClientId()}
                onStorytellerSubmit={actions.storytellerSubmit}
                onPlayerSubmitCard={actions.playerSubmitCard}
                onPlayerVote={actions.playerVote}
                onAdvanceRound={actions.advanceRound}
              />
            }
          />
          
          <Route
            path="/board"
            element={<BoardPage roomState={roomState} />}
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;

