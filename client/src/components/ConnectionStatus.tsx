import { Icon, IconSize, Button } from "./ui";

interface ConnectionStatusProps {
  isConnected: boolean;
  isReconnecting: boolean;
  needsManualReconnect: boolean;
  onRetry: () => void;
  t: (key: string, values?: Record<string, string | number>) => string;
}

/**
 * Connection Status Banner
 * 
 * Shows a banner at the top of the screen when connection is lost or reconnecting.
 * Hidden when connected normally.
 * 
 * States:
 * - Connected: Hidden (no banner)
 * - Reconnecting: Yellow banner with spinner
 * - Disconnected (needs manual reconnect): Red banner with retry button
 */
export function ConnectionStatus({
  isConnected,
  isReconnecting,
  needsManualReconnect,
  onRetry,
  t,
}: ConnectionStatusProps) {
  // Don't show anything when connected
  if (isConnected && !isReconnecting && !needsManualReconnect) {
    return null;
  }

  // Determine the state and styling
  let statusClass = "connection-banner";
  let icon: React.ReactNode = null;
  let message: string = "";
  let showRetryButton = false;

  if (needsManualReconnect) {
    statusClass += " connection-banner--error";
    icon = <Icon.WifiOff size={IconSize.medium} />;
    message = t("connection.disconnected");
    showRetryButton = true;
  } else if (isReconnecting) {
    statusClass += " connection-banner--warning";
    icon = <Icon.Loader size={IconSize.medium} className="connection-spinner" />;
    message = t("connection.reconnecting");
  } else if (!isConnected) {
    statusClass += " connection-banner--warning";
    icon = <Icon.Loader size={IconSize.medium} className="connection-spinner" />;
    message = t("connection.connecting");
  }

  return (
    <div className={statusClass} role="alert" aria-live="polite">
      <div className="connection-banner__content">
        {icon}
        <span className="connection-banner__message">{message}</span>
        {showRetryButton && (
          <Button
            variant="secondary"
            size="small"
            onClick={onRetry}
            className="connection-banner__retry"
          >
            {t("connection.retry")}
          </Button>
        )}
      </div>
    </div>
  );
}

