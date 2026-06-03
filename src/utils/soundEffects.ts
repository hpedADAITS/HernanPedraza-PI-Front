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
  private bufferCache: Map<string, AudioBuffer> = new Map();
  private bufferLoads: Map<string, Promise<void>> = new Map();
  private audioContext: AudioContext | null = null;
  private unlockListenersAttached = false;
  private soundConfigs: Record<string, SoundConfig> = {
    // Navigation & General Buttons
    buttonClick: {
      src: new URL('../assets/sounds/ui/button-click.wav', import.meta.url).href,
      volume: 0.6,
    },
    buttonHover: {
      src: new URL('../assets/sounds/ui/button-hover.wav', import.meta.url).href,
      volume: 0.4,
    },
    navigateBack: {
      src: new URL('../assets/sounds/ui/navigate-back.wav', import.meta.url).href,
      volume: 0.5,
    },

    // Song-related Actions
    suggestSong: {
      src: new URL('../assets/sounds/actions/suggest-song.wav', import.meta.url).href,
      volume: 0.7,
    },
    approveSong: {
      src: new URL('../assets/sounds/actions/approve-song.wav', import.meta.url).href,
      volume: 0.7,
    },
    rejectSong: {
      src: new URL('../assets/sounds/actions/reject-song.wav', import.meta.url).href,
      volume: 0.7,
    },
    skipSong: {
      src: new URL('../assets/sounds/actions/skip-song.wav', import.meta.url).href,
      volume: 0.7,
    },
    songQueued: {
      src: new URL('../assets/sounds/actions/song-queued.wav', import.meta.url).href,
      volume: 0.6,
    },

    // Voting Actions
    voteUp: {
      src: new URL('../assets/sounds/voting/vote-up.wav', import.meta.url).href,
      volume: 0.6,
    },
    voteDown: {
      src: new URL('../assets/sounds/voting/vote-down.wav', import.meta.url).href,
      volume: 0.6,
    },

    // Settings & Preferences
    settingsOpen: {
      src: new URL('../assets/sounds/settings/settings-open.wav', import.meta.url).href,
      volume: 0.5,
    },
    settingsSave: {
      src: new URL('../assets/sounds/settings/settings-save.wav', import.meta.url).href,
      volume: 0.6,
    },
    toggleSwitch: {
      src: new URL('../assets/sounds/settings/toggle-switch.wav', import.meta.url).href,
      volume: 0.5,
    },

    // User Actions
    profileUpdate: {
      src: new URL('../assets/sounds/user/profile-update.wav', import.meta.url).href,
      volume: 0.6,
    },
    microphoneToggle: {
      src: new URL('../assets/sounds/user/microphone-toggle.wav', import.meta.url).href,
      volume: 0.6,
    },
    leaveParty: {
      src: new URL('../assets/sounds/user/leave-party.wav', import.meta.url).href,
      volume: 0.7,
    },

    // Search & Selection
    searchOpen: {
      src: new URL('../assets/sounds/search/search-open.wav', import.meta.url).href,
      volume: 0.5,
    },
    searchSelect: {
      src: new URL('../assets/sounds/search/search-select.wav', import.meta.url).href,
      volume: 0.5,
    },

    // Notifications & Feedback
    success: {
      src: new URL('../assets/sounds/feedback/success.wav', import.meta.url).href,
      volume: 0.6,
    },
    error: {
      src: new URL('../assets/sounds/feedback/error.wav', import.meta.url).href,
      volume: 0.6,
    },
    warning: {
      src: new URL('../assets/sounds/feedback/warning.wav', import.meta.url).href,
      volume: 0.6,
    },

    // Modal Actions
    modalOpen: {
      src: new URL('../assets/sounds/modals/modal-open.wav', import.meta.url).href,
      volume: 0.5,
    },
    modalClose: {
      src: new URL('../assets/sounds/modals/modal-close.wav', import.meta.url).href,
      volume: 0.5,
    },
    confirmAction: {
      src: new URL('../assets/sounds/modals/confirm-action.wav', import.meta.url).href,
      volume: 0.6,
    },
    cancelAction: {
      src: new URL('../assets/sounds/modals/cancel-action.wav', import.meta.url).href,
      volume: 0.5,
    },

    // Auth Actions
    login: {
      src: new URL('../assets/sounds/auth/login.wav', import.meta.url).href,
      volume: 0.7,
    },
    logout: {
      src: new URL('../assets/sounds/auth/logout.wav', import.meta.url).href,
      volume: 0.6,
    },
    register: {
      src: new URL('../assets/sounds/auth/register.wav', import.meta.url).href,
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
    audio.preload = 'auto';
    audio.volume = config.volume ?? 0.5;
    audio.loop = config.loop ?? false;

    // Cache it
    this.audioCache.set(soundKey, audio);

    // Handle errors silently
    audio.onerror = () => {
      console.warn(`Failed to load audio: ${config.src}`);
    };
    audio.load();

    return audio;
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (this.audioContext) return this.audioContext;

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return null;

    this.audioContext = new AudioContextClass();
    return this.audioContext;
  }

  private loadBuffer(soundKey: string): void {
    const config = this.soundConfigs[soundKey];
    const context = this.getContext();
    if (!config || !context || this.bufferCache.has(soundKey) || this.bufferLoads.has(soundKey)) return;

    this.bufferLoads.set(
      soundKey,
      fetch(config.src)
        .then((response) => response.arrayBuffer())
        .then((data) => context.decodeAudioData(data))
        .then((buffer) => {
          this.bufferCache.set(soundKey, buffer);
        })
        .catch(() => {})
        .finally(() => {
          this.bufferLoads.delete(soundKey);
        }),
    );
  }

  private playBuffer(soundKey: string): boolean {
    const context = this.getContext();
    const buffer = this.bufferCache.get(soundKey);
    const config = this.soundConfigs[soundKey];
    if (!context || !buffer || !config) return false;

    const start = () => {
      const source = context.createBufferSource();
      const gain = context.createGain();
      source.buffer = buffer;
      gain.gain.value = config.volume ?? 0.5;
      source.connect(gain).connect(context.destination);
      source.start(0);
    };

    if (context.state === 'suspended') {
      context.resume().then(start).catch(() => {});
    } else {
      start();
    }
    return true;
  }

  private unlockContext = (): void => {
    this.audioContext?.resume().catch(() => {});
  };

  private attachUnlockListeners(): void {
    if (typeof window === 'undefined' || this.unlockListenersAttached) return;
    this.unlockListenersAttached = true;
    ['pointerdown', 'touchstart', 'keydown'].forEach((event) => {
      window.addEventListener(event, this.unlockContext, { capture: true, passive: true });
    });
  }

  /**
   * Play a sound effect
   * @param soundKey - Key of the sound to play (from soundConfigs)
   */
  play(soundKey: string): void {
    if (typeof window === 'undefined') return; // SSR safety

    this.loadBuffer(soundKey);
    if (this.playBuffer(soundKey)) return;

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
    this.loadBuffer(soundKey);
  }

  /**
   * Preload multiple sounds
   */
  preloadAll(soundKeys: string[] = Object.keys(this.soundConfigs)): void {
    this.attachUnlockListeners();
    soundKeys.forEach((key) => this.preload(key));
  }
}

export const soundEffects = new SoundEffectsManager();
