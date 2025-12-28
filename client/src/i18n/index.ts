/**
 * Lightweight i18n System - Zero Dependencies
 *
 * Custom internationalization solution with:
 * - Type-safe translations
 * - React hook for easy usage
 * - Priority: Player override > Room default > Browser > English fallback
 * - No external libraries needed
 */

import { useState, useEffect } from "react";
import { Language, TranslationKeys } from "./types";
import { en } from "./en";
import { he } from "./he";
import { storage } from "../utils/storage";

/**
 * All available translations
 */
const translations: Record<Language, TranslationKeys> = {
  en,
  he,
};

/**
 * Get browser's preferred language
 */
function getBrowserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("he")) return "he";
  return "en"; // Default to English
}

/**
 * Determine which language to use based on priority:
 * 1. Player's personal override (localStorage)
 * 2. Room's default language (from roomState)
 * 3. Browser language
 * 4. English fallback
 */
export function getLanguage(roomLanguage?: Language | null): Language {
  // Priority 1: Player override
  const playerOverride = storage.playerLanguage.get();
  if (playerOverride) return playerOverride;

  // Priority 2: Room default
  if (roomLanguage) return roomLanguage;

  // Priority 3: Browser language
  return getBrowserLanguage();
}

/**
 * Set player's personal language preference (overrides room default)
 */
export function setPlayerLanguage(language: Language | null): void {
  if (language === null) {
    storage.playerLanguage.remove();
  } else {
    storage.playerLanguage.set(language);
  }
}

/**
 * Get player's personal language override (if any)
 */
export function getPlayerLanguageOverride(): Language | null {
  return storage.playerLanguage.get();
}

/**
 * Check if player has a personal language override
 */
export function hasPlayerLanguageOverride(): boolean {
  return storage.playerLanguage.get() !== null;
}

/**
 * Translation function with template support
 *
 * Examples:
 * - t('join.title') → "DIXIT"
 * - t('status.needMoreImages', { count: 5 }) → "Need 5 more images to start"
 * - t('status.winnerIs', { name: 'Alice', score: 30 }) → "Alice wins with 30 points!"
 */
type TemplateValues = Record<string, string | number>;

/**
 * Type for the translation function
 */
export type TranslateFunction = (
  key: string,
  values?: TemplateValues
) => string;

function interpolate(template: string, values?: TemplateValues): string {
  if (!values) return template;

  return Object.entries(values).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, template);
}

/**
 * Get nested translation value from translation object
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;

  for (const key of keys) {
    if (current === undefined || current === null) return undefined;
    current = current[key];
  }

  return typeof current === "string" ? current : undefined;
}

/**
 * Create translation function for a specific language
 */
export function createTranslationFunction(language: Language) {
  return function t(key: string, values?: TemplateValues): string {
    const translation = getNestedValue(translations[language], key);

    if (translation === undefined) {
      // Fallback to English if translation not found
      const fallback = getNestedValue(translations.en, key);
      if (fallback === undefined) {
        console.warn(`Translation missing for key: ${key}`);
        return key;
      }
      return interpolate(fallback, values);
    }

    return interpolate(translation, values);
  };
}

/**
 * React Hook for translations
 *
 * Usage:
 * ```tsx
 * function MyComponent({ roomState }) {
 *   const { t, language } = useTranslation(roomState?.language);
 *
 *   return <h1>{t('join.title')}</h1>;
 * }
 * ```
 */
export function useTranslation(roomLanguage?: Language | null) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() =>
    getLanguage(roomLanguage)
  );

  // Update language when room language changes or localStorage changes
  useEffect(() => {
    const newLanguage = getLanguage(roomLanguage);
    if (newLanguage !== currentLanguage) {
      setCurrentLanguage(newLanguage);
    }
  }, [roomLanguage, currentLanguage]);

  // Listen for storage changes (when player changes language in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dixit-playerLanguage") {
        const newLanguage = getLanguage(roomLanguage);
        setCurrentLanguage(newLanguage);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [roomLanguage]);

  const t = createTranslationFunction(currentLanguage);

  return {
    t,
    language: currentLanguage,
    isRTL: currentLanguage === "he",
  };
}

/**
 * Get direction for language (for HTML dir attribute)
 */
export function getLanguageDirection(language: Language): "ltr" | "rtl" {
  return language === "he" ? "rtl" : "ltr";
}

/**
 * Alias for getLanguageDirection (for convenience)
 */
export function getTextDirection(language: Language): "ltr" | "rtl" {
  return getLanguageDirection(language);
}

// Re-export types and translations for convenience
export type { Language, TranslationKeys } from "./types";
export { en, he };
