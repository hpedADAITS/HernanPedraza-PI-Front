import { useState, useEffect } from 'react';

const DARK_MODE_KEY = 'darkMode:v1';
const LEGACY_DARK_MODE_KEY = 'darkMode';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem(DARK_MODE_KEY) ?? localStorage.getItem(LEGACY_DARK_MODE_KEY);
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem(DARK_MODE_KEY, JSON.stringify(isDarkMode));
    /* Trigger storage event for other components */
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: DARK_MODE_KEY,
        newValue: JSON.stringify(isDarkMode),
      }),
    );
  }, [isDarkMode]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === DARK_MODE_KEY || e.key === LEGACY_DARK_MODE_KEY) && e.newValue) {
        setIsDarkMode(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [isDarkMode, setIsDarkMode] as const;
}
