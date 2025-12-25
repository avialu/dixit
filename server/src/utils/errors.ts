/**
 * Custom Error Classes - Single Source of Truth for Error Handling
 * 
 * These error classes provide better type safety and allow for more
 * granular error handling throughout the application.
 */

/**
 * Error severity levels for client error handling
 */
export enum ErrorSeverity {
  INFO = 'info',        // Informational (e.g., "Please wait...")
  WARNING = 'warning',  // Warning (e.g., "Try again")
  ERROR = 'error',      // Error (e.g., "Something broke")
  FATAL = 'fatal'       // Fatal (e.g., "Reload page")
}

/**
 * Base error class for all game-related errors
 */
export class GameError extends Error {
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;

  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 400,
    severity: ErrorSeverity = ErrorSeverity.ERROR,
    retryable: boolean = false
  ) {
    super(message);
    this.name = "GameError";
    this.severity = severity;
    this.retryable = retryable;
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      message: this.message,
      code: this.code,
      severity: this.severity,
      retryable: this.retryable,
    };
  }
}

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends GameError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400, ErrorSeverity.WARNING, false);
    this.name = "ValidationError";
    if (field) {
      this.code = `VALIDATION_ERROR_${field.toUpperCase()}`;
    }
  }
}

/**
 * Permission error - for unauthorized actions
 */
export class PermissionError extends GameError {
  constructor(message: string) {
    super(message, "PERMISSION_ERROR", 403, ErrorSeverity.ERROR, false);
    this.name = "PermissionError";
  }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends GameError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404, ErrorSeverity.ERROR, false);
    this.name = "NotFoundError";
  }
}

/**
 * Game state error - for invalid game state transitions
 */
export class GameStateError extends GameError {
  constructor(message: string, currentState?: string, expectedState?: string) {
    super(message, "GAME_STATE_ERROR", 400, ErrorSeverity.WARNING, false);
    this.name = "GameStateError";
    if (currentState && expectedState) {
      this.code = `GAME_STATE_ERROR_${currentState}_TO_${expectedState}`;
    }
  }
}

/**
 * Network error - connection or communication issue
 */
export class NetworkError extends GameError {
  constructor(message: string, code: string = 'NETWORK_ERROR') {
    super(message, code, 500, ErrorSeverity.WARNING, true);
    this.name = 'NetworkError';
  }
}

/**
 * Rate limit error - too many requests
 */
export class RateLimitError extends GameError {
  public readonly retryAfter: number; // seconds

  constructor(message: string, retryAfter: number = 10, code: string = 'RATE_LIMIT') {
    super(message, code, 429, ErrorSeverity.WARNING, true);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * Check if an error is a known GameError instance
 */
export function isGameError(error: unknown): error is GameError {
  return error instanceof GameError;
}

/**
 * Extract error message safely from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unknown error occurred";
}

/**
 * Extract error code safely from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isGameError(error)) {
    return error.code;
  }
  return undefined;
}

/**
 * Get error severity from error (or default)
 */
export function getErrorSeverity(error: unknown): ErrorSeverity {
  if (isGameError(error)) {
    return error.severity;
  }
  return ErrorSeverity.ERROR;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (isGameError(error)) {
    return error.retryable;
  }
  return false;
}

