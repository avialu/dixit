/**
 * Logger Utility - Centralized logging for the server
 * 
 * Provides structured logging with different log levels and formatting.
 * In production, this could be extended to write to files or external services.
 */

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  context?: Record<string, any>;
}

class Logger {
  private minLevel: LogLevel;

  constructor(minLevel: LogLevel = LogLevel.INFO) {
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const currentLevelIndex = levels.indexOf(this.minLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(entry: LogEntry): string {
    const contextStr = entry.context
      ? `\n  Context: ${JSON.stringify(entry.context, null, 2)}`
      : "";
    return `[${entry.timestamp}] ${entry.level}: ${entry.message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      level,
      timestamp: new Date().toISOString(),
      message,
      context,
    };

    const formattedMessage = this.formatMessage(entry);

    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Log a game event (e.g., player joined, round started, etc.)
   */
  gameEvent(event: string, context?: Record<string, any>): void {
    this.info(`[GAME] ${event}`, context);
  }

  /**
   * Log a socket event
   */
  socketEvent(event: string, socketId: string, context?: Record<string, any>): void {
    this.debug(`[SOCKET] ${event}`, { socketId, ...context });
  }

  /**
   * Log a player action
   */
  playerAction(clientId: string, action: string, context?: Record<string, any>): void {
    this.info(`[PLAYER] ${action}`, { clientId, ...context });
  }
}

// Create singleton instance
// In development, use DEBUG level; in production, use INFO
const logLevel =
  process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG;

export const logger = new Logger(logLevel);

/**
 * Convenience functions for backward compatibility with console.log
 */
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  gameEvent: logger.gameEvent.bind(logger),
  socketEvent: logger.socketEvent.bind(logger),
  playerAction: logger.playerAction.bind(logger),
};

