import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useSocket } from "./hooks/useSocket";
import { useGameState } from "./hooks/useGameState";
import { UnifiedGamePage } from "./pages/UnifiedGamePage";
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
                onJoinSpectator={actions.joinSpectator}
                onLeave={actions.leave}
                onUploadImage={actions.uploadImage}
                onDeleteImage={actions.deleteImage}
                onSetAllowPlayerUploads={actions.setAllowPlayerUploads}
                onStartGame={actions.startGame}
                onChangeName={actions.changeName}
                onStorytellerSubmit={actions.storytellerSubmit}
                onPlayerSubmitCard={actions.playerSubmitCard}
                onPlayerVote={actions.playerVote}
                onAdvanceRound={actions.advanceRound}
                onResetGame={actions.resetGame}
                onNewDeck={actions.newDeck}
              />
            }
          />

          <Route path="/demo" element={<DemoPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
