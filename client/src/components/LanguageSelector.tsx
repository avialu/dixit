/**
 * Language Selector Component
 * 
 * Dropdown for selecting game language with:
 * - Flag emoji + native language name
 * - Indicator for room default vs personal override
 * - Admin can set room default
 * - All players can set personal override
 */

import { Language } from '../i18n/types';

interface LanguageSelectorProps {
  value: Language;
  onChange: (language: Language) => void;
  roomDefault?: Language;
  isAdmin?: boolean;
  showOverrideToggle?: boolean;
  hasOverride?: boolean;
  onClearOverride?: () => void;
}

export function LanguageSelector({
  value,
  onChange,
  roomDefault,
  isAdmin = false,
  showOverrideToggle = false,
  hasOverride = false,
  onClearOverride,
}: LanguageSelectorProps) {
  const languages: { code: Language; flag: string; name: string }[] = [
    { code: 'en', flag: '🇺🇸', name: 'English' },
    { code: 'he', flag: '🇮🇱', name: 'עברית' },
  ];

  return (
    <div className="language-selector">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Language)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>

      {/* Show status indicator for non-admin players */}
      {!isAdmin && showOverrideToggle && (
        <div className="language-status">
          {hasOverride ? (
            <span className="language-status-badge override">
              Personal preference
              {onClearOverride && (
                <button
                  className="language-clear-override"
                  onClick={onClearOverride}
                  title="Use game default"
                >
                  ✕
                </button>
              )}
            </span>
          ) : (
            <span className="language-status-badge default">
              Using game default
              {roomDefault && roomDefault !== value && (
                <span className="language-hint"> ({roomDefault})</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
