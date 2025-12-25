import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import { useSocket } from "./hooks/useSocket";
import { useGameState } from "./hooks/useGameState";
import { UnifiedGamePage } from "./pages/UnifiedGamePage";
import { DemoPage } from "./pages/DemoPage";
import { CloseButton } from "./components/ui";
import { useTranslation, getTextDirection } from "./i18n";

function App() {
  const {
    socket,
    clientId,
    getClientId,
    isConnected,
    isReconnecting,
    needsManualReconnect,
    manualReconnect,
  } = useSocket();
  const { roomState, playerState, error, actions } = useGameState(socket);
  const { language } = useTranslation(roomState?.language);

  // Update HTML lang and dir attributes when language changes
  useEffect(() => {
    const html = document.documentElement;
    html.lang = language;
    html.dir = getTextDirection(language);
  }, [language]);

  // Get error severity class
  const getErrorClass = () => {
    if (!error) return "";
    const severity = error.severity || "error";
    return `error-toast error-${severity}`;
  };

  return (
    <BrowserRouter>
      <div className="app">
        {/* Connection Status Indicator */}
        {(!isConnected || isReconnecting || needsManualReconnect) && (
          <div
            className={`connection-status ${
              isReconnecting
                ? "reconnecting"
                : needsManualReconnect
                ? "disconnected"
                : "connecting"
            }`}
          >
            <span className="connection-dot"></span>
            {isReconnecting && (
              <span className="connection-text">Reconnecting...</span>
            )}
            {needsManualReconnect && (
              <>
                <span className="connection-text">Connection Lost</span>
                <button
                  className="connection-reconnect-btn"
                  onClick={manualReconnect}
                >
                  Reconnect
                </button>
              </>
            )}
          </div>
        )}

        {error && (
          <div className={getErrorClass()}>
            <span className="error-icon">
              {error.severity === "info" && "ℹ️"}
              {error.severity === "warning" && "⚠️"}
              {error.severity === "error" && "❌"}
              {error.severity === "fatal" && "🚨"}
              {!error.severity && "❌"}
            </span>
            <span className="error-message">{error.message}</span>
            {error.retryable && error.retryAfter && (
              <span className="error-retry">Retry in {error.retryAfter}s</span>
            )}
            <CloseButton onClose={actions.dismissError} />
          </div>
        )}

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
                onSetBoardBackground={actions.setBoardBackground}
                onSetBoardPattern={actions.setBoardPattern}
                onSetLanguage={actions.setLanguage}
                onSetWinTarget={actions.setWinTarget}
                onStartGame={actions.startGame}
                onChangeName={actions.changeName}
                onStorytellerSubmit={actions.storytellerSubmit}
                onPlayerSubmitCard={actions.playerSubmitCard}
                onPlayerVote={actions.playerVote}
                onAdvanceRound={actions.advanceRound}
                onResetGame={actions.resetGame}
                onNewDeck={actions.newDeck}
                onUploadTokenImage={actions.uploadTokenImage}
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
