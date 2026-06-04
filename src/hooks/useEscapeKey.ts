import { useEffect } from 'react';

/**
 * Hook that invokes a callback when the Escape key is pressed.
 * Useful for back button functionality.
 *
 * @param callback - Function to call when ESC is pressed
 * @param enabled - Whether the hook should be active (default: true)
 */
export function useEscapeKey(callback: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callback, enabled]);
}
