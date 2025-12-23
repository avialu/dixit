/**
 * Custom Error Classes - Single Source of Truth for Error Handling
 * 
 * These error classes provide better type safety and allow for more
 * granular error handling throughout the application.
 */

/**
 * Base error class for all game-related errors
 */
export class GameError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "GameError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error - for invalid input data
 */
export class ValidationError extends GameError {
  constructor(message: string, field?: string) {
    super(message, "VALIDATION_ERROR", 400);
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
    super(message, "PERMISSION_ERROR", 403);
    this.name = "PermissionError";
  }
}

/**
 * Not found error - for missing resources
 */
export class NotFoundError extends GameError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
    this.name = "NotFoundError";
  }
}

/**
 * Game state error - for invalid game state transitions
 */
export class GameStateError extends GameError {
  constructor(message: string, currentState?: string, expectedState?: string) {
    super(message, "GAME_STATE_ERROR", 400);
    this.name = "GameStateError";
    if (currentState && expectedState) {
      this.code = `GAME_STATE_ERROR_${currentState}_TO_${expectedState}`;
    }
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

