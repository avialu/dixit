import { useEffect, useState, useCallback } from "react";

export interface TimerProps {
  /** Unix timestamp when the phase started */
  startTime: number | null;
  /** Duration in seconds */
  duration: number | null;
  /** Called when timer reaches zero */
  onTimeUp?: () => void;
  /** Size of the timer circle */
  size?: "small" | "medium" | "large";
  /** Whether to show the timer (false hides it) */
  visible?: boolean;
}

const SIZES = {
  small: 36,
  medium: 48,
  large: 60,
};

/**
 * Circular countdown timer component
 * 
 * Displays remaining time with color transitions:
 * - Green (>50% time remaining)
 * - Yellow (25-50% time remaining)
 * - Red (<25% time remaining) with pulse animation
 */
export function Timer({
  startTime,
  duration,
  onTimeUp,
  size = "medium",
  visible = true,
}: TimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [hasCalledTimeUp, setHasCalledTimeUp] = useState(false);

  // Calculate remaining time
  const calculateRemaining = useCallback(() => {
    if (startTime === null || duration === null) {
      return null;
    }
    const elapsed = (Date.now() - startTime) / 1000;
    const remaining = Math.max(0, duration - elapsed);
    return Math.ceil(remaining);
  }, [startTime, duration]);

  // Reset hasCalledTimeUp when startTime changes (new phase)
  useEffect(() => {
    setHasCalledTimeUp(false);
  }, [startTime]);

  // Update countdown every second
  useEffect(() => {
    if (startTime === null || duration === null) {
      setRemainingSeconds(null);
      return;
    }

    // Initial calculation
    setRemainingSeconds(calculateRemaining());

    // Update every 100ms for smooth countdown
    const interval = setInterval(() => {
      const remaining = calculateRemaining();
      setRemainingSeconds(remaining);

      // Call onTimeUp when timer reaches zero (only once)
      if (remaining !== null && remaining <= 0 && !hasCalledTimeUp && onTimeUp) {
        setHasCalledTimeUp(true);
        onTimeUp();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, duration, calculateRemaining, onTimeUp, hasCalledTimeUp]);

  // Don't render if not visible or no timer data
  if (!visible || startTime === null || duration === null || remainingSeconds === null) {
    return null;
  }

  const sizeValue = SIZES[size];
  const strokeWidth = size === "small" ? 3 : size === "medium" ? 4 : 5;
  const radius = (sizeValue - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate progress (0 to 1, where 1 is full time remaining)
  const progress = Math.max(0, Math.min(1, remainingSeconds / duration));
  const strokeDashoffset = circumference * (1 - progress);

  // Determine color based on remaining time
  const getColor = () => {
    if (progress > 0.5) return "#2ecc71"; // Green
    if (progress > 0.25) return "#f39c12"; // Yellow/Orange
    return "#e74c3c"; // Red
  };

  // Determine if should pulse (less than 25% time or less than 10 seconds)
  const shouldPulse = progress < 0.25 || remainingSeconds <= 10;

  const color = getColor();

  return (
    <div
      className={`phase-timer ${shouldPulse ? "timer-pulse" : ""}`}
      style={{
        width: sizeValue,
        height: sizeValue,
      }}
      aria-label={`${remainingSeconds} seconds remaining`}
      role="timer"
    >
      <svg
        width={sizeValue}
        height={sizeValue}
        viewBox={`0 0 ${sizeValue} ${sizeValue}`}
      >
        {/* Background circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="rgba(0, 0, 0, 0.3)"
          stroke="rgba(255, 255, 255, 0.2)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={sizeValue / 2}
          cy={sizeValue / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${sizeValue / 2} ${sizeValue / 2})`}
          style={{ transition: "stroke-dashoffset 0.1s linear, stroke 0.3s ease" }}
        />
      </svg>
      {/* Timer text */}
      <span
        className="timer-text"
        style={{
          color,
          fontSize: size === "small" ? "0.7rem" : size === "medium" ? "0.9rem" : "1.1rem",
        }}
      >
        {remainingSeconds}
      </span>
    </div>
  );
}

