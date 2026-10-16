import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  resolvedTheme: 'dark',
  isDark: true,
  cycleTheme: () => {},
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'preferred-theme';
const COOKIE_NAME = 'preferred-theme';

/**
 * Returns current OS dark mode preference.
 */
function getSystemPreference() {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Reads initial theme setting (system | light | dark).
 * Order of precedence: data-theme-setting attribute -> cookie -> localStorage -> default 'system'.
 */
function getInitialThemeSetting() {
  if (typeof window === 'undefined') return 'system';

  // 1. Read attribute populated by blocking script in <head>
  const fromAttr = document.documentElement.getAttribute('data-theme-setting');
  if (fromAttr === 'light' || fromAttr === 'dark' || fromAttr === 'system') {
    return fromAttr;
  }

  // 2. Read cookie
  try {
    const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
    if (cookieMatch) {
      const decoded = decodeURIComponent(cookieMatch[1]);
      if (decoded === 'light' || decoded === 'dark' || decoded === 'system') {
        return decoded;
      }
    }
  } catch (err) {
    console.warn('Cookie read warning:', err);
  }

  // 3. Read localStorage (current key or legacy key)
  try {
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('flowguard-theme');
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (err) {
    console.warn('Theme storage access warning:', err);
  }

  // Default to system
  return 'system';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialThemeSetting);
  const [systemPreference, setSystemPreference] = useState(getSystemPreference);

  // Dynamic listener for OS color-scheme changes when in system mode
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleMediaChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
      return () => mediaQuery.removeEventListener('change', handleMediaChange);
    } else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleMediaChange);
      return () => mediaQuery.removeListener(handleMediaChange);
    }
  }, []);

  // Compute active resolved theme: 'light' or 'dark'
  const resolvedTheme = useMemo(() => {
    if (theme === 'system') return systemPreference;
    return theme;
  }, [theme, systemPreference]);

  const isDark = resolvedTheme === 'dark';

  // Apply DOM classes, attributes, color-scheme style, and storage persistence
  const applyTheme = useCallback((nextTheme) => {
    setThemeState(nextTheme);

    const actualResolved = nextTheme === 'system'
      ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : nextTheme;

    try {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(actualResolved);
      root.setAttribute('data-theme', actualResolved);
      root.setAttribute('data-theme-setting', nextTheme);
      root.style.colorScheme = actualResolved;

      // Update theme-color meta tag
      const meta = document.getElementById('theme-color-meta');
      if (meta) {
        meta.setAttribute('content', actualResolved === 'dark' ? '#0b0b0c' : '#ffffff');
      }

      // Persist to cookie (1 year, SameSite=Lax)
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(nextTheme)}; path=/; max-age=31536000; SameSite=Lax`;

      // Persist to localStorage
      localStorage.setItem(STORAGE_KEY, nextTheme);
      localStorage.setItem('flowguard-theme', nextTheme);

      // Dispatch custom event for canvas / 3D modules
      window.dispatchEvent(new CustomEvent('flowguard-theme-change', {
        detail: { theme: nextTheme, resolvedTheme: actualResolved }
      }));
    } catch (err) {
      console.warn('Could not persist theme:', err);
    }
  }, []);

  // 3-state cycler: System -> Light -> Dark -> System
  const cycleTheme = useCallback(() => {
    if (theme === 'system') {
      applyTheme('light');
    } else if (theme === 'light') {
      applyTheme('dark');
    } else {
      applyTheme('system');
    }
  }, [theme, applyTheme]);

  const toggleTheme = cycleTheme;

  const setTheme = useCallback((next) => {
    if (next === 'system' || next === 'light' || next === 'dark') {
      applyTheme(next);
    }
  }, [applyTheme]);

  // Synchronize DOM whenever resolvedTheme updates (e.g. system mode + OS toggle)
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
    root.setAttribute('data-theme', resolvedTheme);
    root.setAttribute('data-theme-setting', theme);
    root.style.colorScheme = resolvedTheme;

    const meta = document.getElementById('theme-color-meta');
    if (meta) {
      meta.setAttribute('content', isDark ? '#0b0b0c' : '#ffffff');
    }
  }, [resolvedTheme, theme, isDark]);

  const value = useMemo(() => ({
    theme,
    resolvedTheme,
    isDark,
    cycleTheme,
    toggleTheme,
    setTheme,
  }), [theme, resolvedTheme, isDark, cycleTheme, toggleTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
