export const THEME_STORAGE_KEY = 'dubaiKharidTheme';
export const THEME_MODES = Object.freeze(['light', 'dark', 'system']);

export function normalizeThemePreference(value) {
  return THEME_MODES.includes(value) ? value : 'system';
}

export function resolveTheme(preference, systemPrefersDark = false) {
  const normalized = normalizeThemePreference(preference);
  return normalized === 'system' ? (systemPrefersDark ? 'dark' : 'light') : normalized;
}

export const THEME_BOOTSTRAP_SCRIPT = `
(function () {
  try {
    var key = '${THEME_STORAGE_KEY}';
    var saved = null;
    try { saved = localStorage.getItem(key); } catch (_) {}
    var preference = saved === 'light' || saved === 'dark' || saved === 'system' ? saved : 'system';
    var darkSystem = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = preference === 'system' ? (darkSystem ? 'dark' : 'light') : preference;
    var root = document.documentElement;
    root.dataset.theme = resolved;
    root.dataset.themePreference = preference;
    root.style.colorScheme = resolved;
  } catch (_) {
    var fallbackDark = false;
    try { fallbackDark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (_) {}
    document.documentElement.dataset.theme = fallbackDark ? 'dark' : 'light';
    document.documentElement.dataset.themePreference = 'system';
    document.documentElement.style.colorScheme = fallbackDark ? 'dark' : 'light';
  }
})();`;
