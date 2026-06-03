import { useCallback } from 'react';
import { soundEffects } from '@/utils/soundEffects';

/**
 * Hook for playing sound effects in React components
 * Provides type-safe access to all configured sounds
 *
 * @example
 * const { playSound } = useSound();
 *
 * const handleButtonClick = () => {
 *   playSound('buttonClick');
 *   // ... button action
 * };
 */
export function useSound() {
  const playSound = useCallback((soundKey: string) => {
    soundEffects.play(soundKey);
  }, []);

  const stopAllSounds = useCallback(() => {
    soundEffects.stopAll();
  }, []);

  const setVolume = useCallback((soundKey: string, volume: number) => {
    soundEffects.setVolume(soundKey, volume);
  }, []);

  const setMasterVolume = useCallback((volume: number) => {
    soundEffects.setMasterVolume(volume);
  }, []);

  const preloadSound = useCallback((soundKey: string) => {
    soundEffects.preload(soundKey);
  }, []);

  return {
    playSound,
    stopAllSounds,
    setVolume,
    setMasterVolume,
    preloadSound,
    isSupported: soundEffects.isSupported(),
  };
}
