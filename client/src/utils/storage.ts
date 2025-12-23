/**
 * Storage Utility - Single Source of Truth for localStorage
 *
 * Abstracts localStorage access for better maintainability and testing.
 * All localStorage keys are defined here to prevent typos and inconsistencies.
 */

const STORAGE_KEYS = {
  CLIENT_ID: "dixit-clientId",
  HAS_JOINED: "dixit-hasJoined",
  IS_SPECTATOR: "dixit-isSpectator",
} as const;

/**
 * Storage wrapper for client ID
 */
export const clientIdStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(STORAGE_KEYS.CLIENT_ID);
    } catch (error) {
      console.error("Failed to get client ID from storage:", error);
      return null;
    }
  },

  set: (clientId: string): void => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLIENT_ID, clientId);
    } catch (error) {
      console.error("Failed to save client ID to storage:", error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.CLIENT_ID);
    } catch (error) {
      console.error("Failed to remove client ID from storage:", error);
    }
  },
};

/**
 * Storage wrapper for hasJoined flag
 */
export const hasJoinedStorage = {
  get: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.HAS_JOINED) === "true";
    } catch (error) {
      console.error("Failed to get hasJoined from storage:", error);
      return false;
    }
  },

  set: (hasJoined: boolean): void => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.HAS_JOINED,
        hasJoined ? "true" : "false"
      );
    } catch (error) {
      console.error("Failed to save hasJoined to storage:", error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.HAS_JOINED);
    } catch (error) {
      console.error("Failed to remove hasJoined from storage:", error);
    }
  },
};

/**
 * Storage wrapper for isSpectator flag
 */
export const isSpectatorStorage = {
  get: (): boolean => {
    try {
      return localStorage.getItem(STORAGE_KEYS.IS_SPECTATOR) === "true";
    } catch (error) {
      console.error("Failed to get isSpectator from storage:", error);
      return false;
    }
  },

  set: (isSpectator: boolean): void => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.IS_SPECTATOR,
        isSpectator ? "true" : "false"
      );
    } catch (error) {
      console.error("Failed to save isSpectator to storage:", error);
    }
  },

  remove: (): void => {
    try {
      localStorage.removeItem(STORAGE_KEYS.IS_SPECTATOR);
    } catch (error) {
      console.error("Failed to remove isSpectator from storage:", error);
    }
  },
};

/**
 * Unified storage object for convenience
 */
export const storage = {
  clientId: clientIdStorage,
  hasJoined: hasJoinedStorage,
  isSpectator: isSpectatorStorage,
};
