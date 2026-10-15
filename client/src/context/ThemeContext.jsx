import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const ThemeContext = createContext({
  theme: 'dark',
  isDark: true,
  toggleTheme: () => {},
  setTheme: () => {},
});

const STORAGE_KEY = 'flowguard-theme';

/**
 * Reads initial theme avoiding flash: checks HTML attribute first, then localStorage, then OS media query.
 */
function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  
  const fromAttr = document.documentElement.getAttribute('data-theme');
  if (fromAttr === 'light' || fromAttr === 'dark') return fromAttr;
  
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch (err) {
    console.warn('Theme storage access warning:', err);
  }

  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    return 'light';
  }
  return 'dark';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  const applyTheme = (nextTheme) => {
    setThemeState(nextTheme);
    try {
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem(STORAGE_KEY, nextTheme);
      // Dispatch custom event for vanilla JS or WebGL canvas components
      window.dispatchEvent(new CustomEvent('flowguard-theme-change', { detail: { theme: nextTheme } }));
    } catch (err) {
      console.warn('Could not persist theme:', err);
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (nextTheme) => {
    if (nextTheme === 'light' || nextTheme === 'dark') {
      applyTheme(nextTheme);
    }
  };

  // Sync with OS preference if user has not explicitly locked a choice
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        applyTheme(e.matches ? 'dark' : 'light');
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []);

  // Ensure DOM attribute is in sync on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    toggleTheme,
    setTheme,
  }), [theme]);

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
