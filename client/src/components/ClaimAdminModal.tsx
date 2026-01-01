import { useState } from "react";
import { Button, CloseButton, Input, Icon, IconSize } from "./ui";
import { useTranslation } from "../i18n";

interface ClaimAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimAdmin: (password: string) => Promise<boolean>;
  language?: "en" | "he";
}

/**
 * ClaimAdminModal - Claim admin role with password
 *
 * Any player can use this modal to become admin by entering the correct
 * password. This replaces the auto-transfer logic and makes the system
 * resilient to flaky WiFi connections.
 */
export function ClaimAdminModal({
  isOpen,
  onClose,
  onClaimAdmin,
  language = "en",
}: ClaimAdminModalProps) {
  const { t } = useTranslation(language);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) return;

    setIsLoading(true);
    setError(null);

    try {
      const success = await onClaimAdmin(password);
      if (success) {
        setPassword("");
        onClose();
      } else {
        setError(t("admin.wrongPassword"));
      }
    } catch (err) {
      setError(t("admin.wrongPassword"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && password && !isLoading) {
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
          <h2>
            <Icon.Crown size={IconSize.large} style={{ marginRight: "0.5rem" }} />
            {t("admin.claimAdminTitle")}
          </h2>
        </div>

        {/* Content */}
        <div className="confirm-modal-content">
          <p style={{ marginBottom: "1rem", color: "#888", fontSize: "0.9rem" }}>
            {t("admin.claimAdminDescription")}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Input
              type="password"
              placeholder={t("admin.enterPassword")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
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
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {t("common.cancel")}
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!password || isLoading}
          >
            {isLoading ? t("common.loading") : t("admin.claim")}
          </Button>
        </div>
      </div>
    </>
  );
}

