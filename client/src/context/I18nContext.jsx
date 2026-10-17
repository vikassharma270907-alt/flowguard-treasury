/**
 * Internationalization (i18n) Context Provider
 * 
 * Supports English ('en') and Hindi ('hi').
 * Features:
 * - Cookie-backed persistence ('preferred-lang') to prevent hydration flash
 * - Automatic synchronisation with document.documentElement.lang
 * - Fallback to English if translation key is missing in Hindi
 * 
 * NOTE: Hindi translations in hi.json are draft machine translations and
 * require certified human legal/vernacular review before production release.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en.json';
import hi from '../locales/hi.json';

const translations = { en, hi };

const I18nContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key) => key
});

function getInitialLanguage() {
  if (typeof document === 'undefined') return 'en';
  try {
    // 1. Try reading preferred-lang from cookie (prevents hydration flash)
    const cookieMatch = document.cookie.match(/(?:^|; )preferred-lang=([^;]*)/);
    if (cookieMatch) {
      const cookieVal = decodeURIComponent(cookieMatch[1]);
      if (cookieVal === 'en' || cookieVal === 'hi') {
        return cookieVal;
      }
    }
    // 2. Fall back to localStorage
    const saved = localStorage.getItem('preferred-lang');
    if (saved === 'en' || saved === 'hi') {
      return saved;
    }
  } catch (e) {
    console.warn('Could not read saved language preference:', e);
  }
  return 'en';
}

export const I18nProvider = ({ children }) => {
  const [language, setLanguageState] = useState(getInitialLanguage);

  const setLanguage = (lang) => {
    if (lang !== 'en' && lang !== 'hi') return;
    setLanguageState(lang);
    try {
      // Persist in cookie (1 year expiry, SameSite=Lax)
      document.cookie = `preferred-lang=${encodeURIComponent(lang)}; path=/; max-age=31536000; SameSite=Lax`;
      // Also persist in localStorage for offline/SPA compatibility
      localStorage.setItem('preferred-lang', lang);
    } catch (e) {
      console.warn('Could not save language preference:', e);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  /**
   * Helper to retrieve nested keys like t('nav.home') or t('columns.product')
   */
  const t = (path, params) => {
    if (!path) return '';
    const keys = path.split('.');
    let current = translations[language] || translations.en;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fKey of keys) {
          if (fallback && typeof fallback === 'object' && fKey in fallback) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        current = fallback || path;
        break;
      }
    }
    if (typeof current === 'string' && params && typeof params === 'object') {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }, current);
    }
    return current;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
