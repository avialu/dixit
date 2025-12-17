import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSocket } from "./hooks/useSocket";
import { useGameState } from "./hooks/useGameState";
import { UnifiedGamePage } from "./pages/UnifiedGamePage";
import { BoardPage } from "./pages/BoardPage";
import { DemoPage } from "./pages/DemoPage";

function App() {
  const { socket, clientId, getClientId } = useSocket();
  const { roomState, playerState, error, actions } = useGameState(socket);

  return (
    <BrowserRouter>
      <div className="app">
        {error && <div className="error-toast">{error}</div>}

        <Routes>
          <Route
            path="/"
            element={
              <UnifiedGamePage
                roomState={roomState}
                playerState={playerState}
                playerId={getClientId()}
                clientId={clientId}
                socket={socket}
                onJoin={actions.join}
                onUploadImage={actions.uploadImage}
                onDeleteImage={actions.deleteImage}
                onSetDeckMode={actions.setDeckMode}
                onLockDeck={actions.lockDeck}
                onUnlockDeck={actions.unlockDeck}
                onStartGame={actions.startGame}
                onChangeName={actions.changeName}
                onKickPlayer={actions.kickPlayer}
                onPromotePlayer={actions.promotePlayer}
                onStorytellerSubmit={actions.storytellerSubmit}
                onPlayerSubmitCard={actions.playerSubmitCard}
                onPlayerVote={actions.playerVote}
                onAdvanceRound={actions.advanceRound}
                onResetGame={actions.resetGame}
                onNewDeck={actions.newDeck}
                onSetWinTarget={actions.setWinTarget}
              />
            }
          />

          <Route path="/board" element={<BoardPage roomState={roomState} />} />

          <Route path="/demo" element={<DemoPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
