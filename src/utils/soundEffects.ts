/**
 * Sound Effects Manager
 * Centralized management of all button interaction sounds in the application.
 * Supports play, pause, stop, and volume control.
 */

interface SoundConfig {
  src: string;
  volume?: number;
  loop?: boolean;
}

class SoundEffectsManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private soundConfigs: Record<string, SoundConfig> = {
    // Navigation & General Buttons
    buttonClick: {
      src: '/src/assets/sounds/ui/button-click.wav',
      volume: 0.6,
    },
    buttonHover: {
      src: '/src/assets/sounds/ui/button-hover.wav',
      volume: 0.4,
    },
    navigateBack: {
      src: '/src/assets/sounds/ui/navigate-back.wav',
      volume: 0.5,
    },

    // Song-related Actions
    suggestSong: {
      src: '/src/assets/sounds/actions/suggest-song.wav',
      volume: 0.7,
    },
    approveSong: {
      src: '/src/assets/sounds/actions/approve-song.wav',
      volume: 0.7,
    },
    rejectSong: {
      src: '/src/assets/sounds/actions/reject-song.wav',
      volume: 0.7,
    },
    skipSong: {
      src: '/src/assets/sounds/actions/skip-song.wav',
      volume: 0.7,
    },
    songQueued: {
      src: '/src/assets/sounds/actions/song-queued.wav',
      volume: 0.6,
    },

    // Voting Actions
    voteUp: {
      src: '/src/assets/sounds/voting/vote-up.wav',
      volume: 0.6,
    },
    voteDown: {
      src: '/src/assets/sounds/voting/vote-down.wav',
      volume: 0.6,
    },

    // Settings & Preferences
    settingsOpen: {
      src: '/src/assets/sounds/settings/settings-open.wav',
      volume: 0.5,
    },
    settingsSave: {
      src: '/src/assets/sounds/settings/settings-save.wav',
      volume: 0.6,
    },
    toggleSwitch: {
      src: '/src/assets/sounds/settings/toggle-switch.wav',
      volume: 0.5,
    },

    // User Actions
    profileUpdate: {
      src: '/src/assets/sounds/user/profile-update.wav',
      volume: 0.6,
    },
    microphoneToggle: {
      src: '/src/assets/sounds/user/microphone-toggle.wav',
      volume: 0.6,
    },
    leaveParty: {
      src: '/src/assets/sounds/user/leave-party.wav',
      volume: 0.7,
    },

    // Search & Selection
    searchOpen: {
      src: '/src/assets/sounds/search/search-open.wav',
      volume: 0.5,
    },
    searchSelect: {
      src: '/src/assets/sounds/search/search-select.wav',
      volume: 0.5,
    },

    // Notifications & Feedback
    success: {
      src: '/src/assets/sounds/feedback/success.wav',
      volume: 0.6,
    },
    error: {
      src: '/src/assets/sounds/feedback/error.wav',
      volume: 0.6,
    },
    warning: {
      src: '/src/assets/sounds/feedback/warning.wav',
      volume: 0.6,
    },

    // Modal Actions
    modalOpen: {
      src: '/src/assets/sounds/modals/modal-open.wav',
      volume: 0.5,
    },
    modalClose: {
      src: '/src/assets/sounds/modals/modal-close.wav',
      volume: 0.5,
    },
    confirmAction: {
      src: '/src/assets/sounds/modals/confirm-action.wav',
      volume: 0.6,
    },
    cancelAction: {
      src: '/src/assets/sounds/modals/cancel-action.wav',
      volume: 0.5,
    },

    // Auth Actions
    login: {
      src: '/src/assets/sounds/auth/login.wav',
      volume: 0.7,
    },
    logout: {
      src: '/src/assets/sounds/auth/logout.wav',
      volume: 0.6,
    },
    register: {
      src: '/src/assets/sounds/auth/register.wav',
      volume: 0.7,
    },
  };

  /**
   * Get or create an audio element for a sound
   */
  private getAudio(soundKey: string): HTMLAudioElement | null {
    const config = this.soundConfigs[soundKey];
    if (!config) {
      console.warn(`Sound "${soundKey}" not found in configuration`);
      return null;
    }

    // Return cached audio if available
    if (this.audioCache.has(soundKey)) {
      return this.audioCache.get(soundKey)!;
    }

    // Create new audio element
    const audio = new Audio(config.src);
    audio.volume = config.volume ?? 0.5;
    audio.loop = config.loop ?? false;

    // Cache it
    this.audioCache.set(soundKey, audio);

    // Handle errors silently
    audio.onerror = () => {
      console.warn(`Failed to load audio: ${config.src}`);
    };

    return audio;
  }

  /**
   * Play a sound effect
   * @param soundKey - Key of the sound to play (from soundConfigs)
   */
  play(soundKey: string): void {
    if (typeof window === 'undefined') return; // SSR safety

    const audio = this.getAudio(soundKey);
    if (!audio) return;

    try {
      audio.currentTime = 0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Playback failed - likely due to browser autoplay policies
          // This is expected and not an error
        });
      }
    } catch (error) {
      console.warn(`Failed to play sound "${soundKey}":`, error);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll(): void {
    this.audioCache.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Set volume for a specific sound (0 to 1)
   */
  setVolume(soundKey: string, volume: number): void {
    const audio = this.getAudio(soundKey);
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Set volume for all sounds (0 to 1)
   */
  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.audioCache.forEach((audio) => {
      audio.volume = clampedVolume;
    });
  }

  /**
   * Check if sounds are supported and loadable
   */
  isSupported(): boolean {
    return typeof window !== 'undefined' && !!document.createElement('audio').play;
  }

  /**
   * Preload a sound
   */
  preload(soundKey: string): void {
    this.getAudio(soundKey);
  }

  /**
   * Preload multiple sounds
   */
  preloadAll(soundKeys: string[]): void {
    soundKeys.forEach((key) => this.preload(key));
  }
}

export const soundEffects = new SoundEffectsManager();
