/**
 * Storage Utility - Single Source of Truth for localStorage
 *
 * Abstracts localStorage access for better maintainability and testing.
 * All localStorage keys are defined here to prevent typos and inconsistencies.
 */

const STORAGE_KEYS = {
  CLIENT_ID: "dixit-clientId",
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
 * Unified storage object for convenience
 */
export const storage = {
  clientId: clientIdStorage,
};
