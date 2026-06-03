import { useCallback } from 'react';
import { useSound } from '@/hooks/useSound';

/**
 * Hook for playing a sound effect on element hover
 * Provides handlers for onMouseEnter and onMouseLeave
 *
 * @example
 * const { onMouseEnter } = useHoverSound();
 *
 * <button onMouseEnter={onMouseEnter}>Hover me</button>
 */
export function useHoverSound(soundKey: string = 'buttonHover') {
  const { playSound } = useSound();

  const onMouseEnter = useCallback(() => {
    playSound(soundKey);
  }, [soundKey, playSound]);

  return { onMouseEnter };
}

/**
 * Hook for playing a sound on any event (useful for custom interactions)
 *
 * @example
 * const { triggerSound } = useEventSound('buttonClick');
 *
 * <div onFocus={triggerSound}>Custom interaction</div>
 */
export function useEventSound(soundKey: string) {
  const { playSound } = useSound();

  const triggerSound = useCallback(() => {
    playSound(soundKey);
  }, [soundKey, playSound]);

  return { triggerSound };
}
