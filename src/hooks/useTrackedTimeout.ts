import { useCallback, useEffect, useRef } from 'react';

export function useTrackedTimeout() {
  const timersRef = useRef<Set<number> | null>(null);
  if (timersRef.current === null) {
    timersRef.current = new Set<number>();
  }

  useEffect(() => {
    const timers = timersRef.current;
    if (!timers) return;

    return () => {
      timers.forEach(window.clearTimeout);
      timers.clear();
    };
  }, []);

  const clearTrackedTimeout = useCallback((timer: number | null) => {
    if (timer == null) return;
    window.clearTimeout(timer);
    timersRef.current?.delete(timer);
  }, []);

  const setTrackedTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current?.delete(timer);
      callback();
    }, delay);
    timersRef.current?.add(timer);
    return timer;
  }, []);

  return { clearTrackedTimeout, setTrackedTimeout };
}
