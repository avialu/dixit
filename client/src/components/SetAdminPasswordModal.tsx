import { useState } from "react";
import { Button, CloseButton, Input } from "./ui";
import { useTranslation } from "../i18n";

interface SetAdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetPassword: (password: string) => void;
  language?: "en" | "he";
}

/**
 * SetAdminPasswordModal - Set admin password before starting game
 *
 * This modal is shown when the admin tries to start the game without
 * having set a password first. The password is required so that players
 * can reclaim admin if the admin disconnects.
 */
export function SetAdminPasswordModal({
  isOpen,
  onClose,
  onSetPassword,
  language = "en",
}: SetAdminPasswordModalProps) {
  const { t } = useTranslation(language);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    // Validate password
    if (password.length < 4) {
      setError(t("admin.passwordTooShort"));
      return;
    }

    if (password.length > 20) {
      setError(t("admin.passwordTooLong"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("admin.passwordsDoNotMatch"));
      return;
    }

    setError(null);
    onSetPassword(password);
    setPassword("");
    setConfirmPassword("");
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password && confirmPassword) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="confirm-modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className="confirm-modal-popup"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClose={onClose} />

        {/* Header */}
        <div className="confirm-modal-header">
          <h2>{t("admin.setPasswordTitle")}</h2>
        </div>

        {/* Content */}
        <div className="confirm-modal-content">
          <p style={{ marginBottom: "1rem", color: "#888", fontSize: "0.9rem" }}>
            {t("admin.setPasswordDescription")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Input
              type="password"
              placeholder={t("admin.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ padding: "0.75rem", fontSize: "1rem" }}
            />

            <Input
              type="password"
              placeholder={t("admin.confirmPassword")}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ padding: "0.75rem", fontSize: "1rem" }}
            />

            {error && (
              <p style={{ color: "#e74c3c", fontSize: "0.85rem", margin: 0 }}>
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="confirm-modal-footer">
          <Button variant="secondary" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!password || !confirmPassword}
          >
            {t("admin.setPassword")}
          </Button>
        </div>
      </div>
    </>
  );
}

