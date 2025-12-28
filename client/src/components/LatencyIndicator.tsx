import { ConnectionQuality, LATENCY_THRESHOLDS } from "../hooks/useSocket";
import { Icon, IconSize } from "./ui";

interface LatencyIndicatorProps {
  latency: number | null;
  connectionQuality: ConnectionQuality;
  isConnected: boolean;
  compact?: boolean;
}

/**
 * Latency Indicator
 * 
 * Shows a small colored dot indicating connection quality:
 * - Green: Good (< 100ms)
 * - Yellow: Medium (100-300ms)
 * - Red: Poor (> 300ms)
 * - Gray: Unknown/Disconnected
 * 
 * Optionally shows the latency value in ms
 */
export function LatencyIndicator({
  latency,
  connectionQuality,
  isConnected,
  compact = false,
}: LatencyIndicatorProps) {
  if (!isConnected) {
    return (
      <div className="latency-indicator latency-indicator--disconnected" title="Disconnected">
        <Icon.WifiOff size={IconSize.small} />
        {!compact && <span className="latency-indicator__text">Offline</span>}
      </div>
    );
  }

  const getQualityClass = () => {
    switch (connectionQuality) {
      case 'good':
        return 'latency-indicator--good';
      case 'medium':
        return 'latency-indicator--medium';
      case 'poor':
        return 'latency-indicator--poor';
      default:
        return 'latency-indicator--unknown';
    }
  };

  const getQualityLabel = () => {
    switch (connectionQuality) {
      case 'good':
        return 'Good connection';
      case 'medium':
        return 'Fair connection';
      case 'poor':
        return 'Poor connection';
      default:
        return 'Checking connection...';
    }
  };

  const title = latency !== null 
    ? `${getQualityLabel()} (${latency}ms)`
    : getQualityLabel();

  return (
    <div 
      className={`latency-indicator ${getQualityClass()}`} 
      title={title}
      role="status"
      aria-label={title}
    >
      <span className="latency-indicator__dot" />
      {!compact && latency !== null && (
        <span className="latency-indicator__text">{latency}ms</span>
      )}
    </div>
  );
}

/**
 * Helper function to get quality description
 */
export function getLatencyDescription(latency: number | null): string {
  if (latency === null) return 'Checking...';
  if (latency < LATENCY_THRESHOLDS.GOOD) return 'Excellent';
  if (latency < LATENCY_THRESHOLDS.MEDIUM) return 'Good';
  return 'Poor';
}




