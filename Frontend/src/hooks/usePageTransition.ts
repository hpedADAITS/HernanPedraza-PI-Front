import { useState, useEffect } from 'react';

export function usePageTransition() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return { isVisible };
}
