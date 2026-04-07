import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDarkMode } from '@/hooks/useDarkMode';

describe('useDarkMode Hook', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should initialize with false when no saved preference', () => {
    const { result } = renderHook(() => useDarkMode());
    const [isDarkMode] = result.current;

    expect(isDarkMode).toBe(false);
  });

  it('should initialize with saved preference from localStorage', () => {
    localStorage.setItem('darkMode', 'true');

    const { result } = renderHook(() => useDarkMode());
    const [isDarkMode] = result.current;

    expect(isDarkMode).toBe(true);
  });

  it('should toggle dark mode', async () => {
    const { result } = renderHook(() => useDarkMode());
    const [isDarkMode, setIsDarkMode] = result.current;

    expect(isDarkMode).toBe(false);

    act(() => {
      setIsDarkMode(true);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });
  });

  it('should persist dark mode to localStorage', async () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => {
      result.current[1](true);
    });

    await waitFor(() => {
      expect(localStorage.getItem('darkMode')).toBe('true');
    });
  });

  it('should handle multiple toggles', async () => {
    const { result } = renderHook(() => useDarkMode());

    act(() => {
      result.current[1](true);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });

    act(() => {
      result.current[1](false);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(false);
    });

    expect(localStorage.getItem('darkMode')).toBe('false');
  });

  it('should respond to storage events from other tabs', async () => {
    const { result } = renderHook(() => useDarkMode());

    expect(result.current[0]).toBe(false);

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'darkMode',
        newValue: 'true',
      });
      window.dispatchEvent(event);
    });

    await waitFor(() => {
      expect(result.current[0]).toBe(true);
    });
  });

  it('should ignore storage events for other keys', async () => {
    const { result } = renderHook(() => useDarkMode());

    const initialIsDarkMode = result.current[0];

    act(() => {
      const event = new StorageEvent('storage', {
        key: 'someOtherKey',
        newValue: 'someValue',
      });
      window.dispatchEvent(event);
    });

    expect(result.current[0]).toBe(initialIsDarkMode);
  });

  it('should return a tuple with state and setter', () => {
    const { result } = renderHook(() => useDarkMode());

    expect(Array.isArray(result.current)).toBe(true);
    expect(result.current).toHaveLength(2);
    expect(typeof result.current[0]).toBe('boolean');
    expect(typeof result.current[1]).toBe('function');
  });

  it('should handle string false in localStorage', () => {
    localStorage.setItem('darkMode', 'false');

    const { result } = renderHook(() => useDarkMode());
    const [isDarkMode] = result.current;

    expect(isDarkMode).toBe(false);
  });

  it('should handle string true in localStorage', () => {
    localStorage.setItem('darkMode', 'true');

    const { result } = renderHook(() => useDarkMode());
    const [isDarkMode] = result.current;

    expect(isDarkMode).toBe(true);
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useDarkMode());

    expect(removeEventListenerSpy).not.toHaveBeenCalled();

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('storage', expect.any(Function));
  });
});
