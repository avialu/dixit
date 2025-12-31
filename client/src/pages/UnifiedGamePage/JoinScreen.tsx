import { useState } from "react";
import { ProfileImageUpload } from "../../components/ProfileImageUpload";
import { QRCode } from "../../components/QRCode";
import { Button, Icon, IconSize } from "../../components/ui";
import { useTranslation } from "../../i18n";

interface JoinScreenProps {
  serverUrl: string;
  language?: "en" | "he";
  onJoin: (name: string, profileImage: string | null) => void;
  onJoinSpectator: () => void;
  isJoining?: boolean;
  isJoiningSpectator?: boolean;
}

export function JoinScreen({
  serverUrl,
  language = "en",
  onJoin,
  onJoinSpectator,
  isJoining = false,
  isJoiningSpectator = false,
}: JoinScreenProps) {
  const { t } = useTranslation(language);
  const [name, setName] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && !isJoining) {
      onJoin(name.trim(), profileImage);
    }
  };

  // Calculate player color for placeholder
  const getPlayerColor = () => {
    const colors = [
      "#f39c12",
      "#3498db",
      "#2ecc71",
      "#e74c3c",
      "#9b59b6",
      "#1abc9c",
    ];
    const index = Math.floor(Math.random() * colors.length);
    return colors[index];
  };

  return (
    <div className="unified-game-page join-state">
      <div className="join-container">
        <div className="join-box">
          <h1>
            <Icon.Sparkles size={IconSize.xlarge} /> DIXIT
          </h1>
          <p className="tagline">A game of creative storytelling</p>

          <form onSubmit={handleSubmit} className="join-form">
            {/* Profile Image Upload */}
            <div className="join-profile-section">
              <ProfileImageUpload
                imageUrl={profileImage}
                onUpload={setProfileImage}
                onRemove={() => setProfileImage(null)}
                playerColor={getPlayerColor()}
                size="large"
              />
              <p className="join-profile-hint">Add your profile photo</p>
            </div>

            <input
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              autoFocus
              className="name-input"
            />
            <Button
              type="submit"
              variant="primary"
              size="large"
              disabled={!name.trim() || isJoining || isJoiningSpectator}
              loading={isJoining}
              loadingText="Joining..."
            >
              <Icon.Rocket size={IconSize.medium} /> Join Game
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="large"
              onClick={onJoinSpectator}
              disabled={isJoining || isJoiningSpectator}
              loading={isJoiningSpectator}
              loadingText="Joining..."
            >
              👀 Join as Spectator
            </Button>
          </form>
          <div className="qr-code-section">
            <p className="qr-hint">{t("join.scanToJoin")}</p>
            <QRCode url={serverUrl} size={180} />
          </div>
        </div>
      </div>
    </div>
  );
}
