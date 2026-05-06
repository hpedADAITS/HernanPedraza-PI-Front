import { useState, useEffect } from 'react';

export function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    // Trigger storage event for other components
    try {
      localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    } catch {
    }
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'darkMode',
        newValue: JSON.stringify(isDarkMode),
      }),
    );
  }, [isDarkMode]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode' && e.newValue) {
        setIsDarkMode(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return [isDarkMode, setIsDarkMode] as const;
}
