// Theme utility for Light / Dark mode management
// Preserves default dark theme and supports instant switching with localStorage persistence

const THEME_KEY = 'cf_theme';

export function getStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

export function setStoredTheme(theme) {
  const chosen = theme === 'light' ? 'light' : 'dark';
  try {
    localStorage.setItem(THEME_KEY, chosen);
  } catch (err) {
    console.error('Failed to save theme in localStorage:', err);
  }
  document.documentElement.setAttribute('data-theme', chosen);
  window.dispatchEvent(new CustomEvent('themeChange', { detail: chosen }));
  return chosen;
}

export function initTheme() {
  const current = getStoredTheme();
  document.documentElement.setAttribute('data-theme', current);
  return current;
}
