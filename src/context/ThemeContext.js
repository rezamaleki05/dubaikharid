'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { normalizeThemePreference, resolveTheme, THEME_STORAGE_KEY } from '@/lib/theme';

const ThemeContext = createContext(null);

function systemPrefersDark() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
}

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function persistTheme(preference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Theme still applies for the current page when storage is unavailable.
  }
}

function applyTheme(preference) {
  const normalized = normalizeThemePreference(preference);
  const resolved = resolveTheme(normalized, systemPrefersDark());
  const root = document.documentElement;
  root.dataset.theme = resolved;
  root.dataset.themePreference = normalized;
  root.style.colorScheme = resolved;
  return resolved;
}

export function ThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState('system');
  const [resolvedTheme, setResolvedTheme] = useState('light');

  const setTheme = useCallback((nextPreference) => {
    const normalized = normalizeThemePreference(nextPreference);
    persistTheme(normalized);
    setPreferenceState(normalized);
    setResolvedTheme(applyTheme(normalized));
  }, []);

  useEffect(() => {
    const initialPreference = normalizeThemePreference(
      document.documentElement.dataset.themePreference || readStoredTheme(),
    );
    const initialTheme = applyTheme(initialPreference);
    queueMicrotask(() => {
      setPreferenceState(initialPreference);
      setResolvedTheme(initialTheme);
    });

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = () => {
      if (normalizeThemePreference(document.documentElement.dataset.themePreference) === 'system') {
        setResolvedTheme(applyTheme('system'));
      }
    };
    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) return;
      const nextPreference = normalizeThemePreference(event.newValue);
      setPreferenceState(nextPreference);
      setResolvedTheme(applyTheme(nextPreference));
    };

    media.addEventListener('change', handleSystemChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      media.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const value = useMemo(() => ({ preference, resolvedTheme, setTheme }), [preference, resolvedTheme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
