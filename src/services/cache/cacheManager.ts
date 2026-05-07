/**
 * Cache Manager
 * Handles browser-based caching with expiration and request throttling
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface RequestCooldown {
  lastRequestTime: number;
  cooldownMs: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private requestCooldowns: Map<string, RequestCooldown> = new Map();
  private localStorage: Storage | null = null;
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_COOLDOWN = 1000; // 1 second

  constructor() {
    // Initialize localStorage if available
    if (typeof window !== 'undefined') {
      this.localStorage = window.localStorage;
      this.loadFromLocalStorage();
    }
  }

  /**
   * Set a cache entry
   */
  set<T>(key: string, data: T, ttlMs: number = this.DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttlMs,
    };

    this.cache.set(key, entry);
    this.persistToLocalStorage(key, entry);
  }

  /**
   * Get a cache entry if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Check if a key exists and hasn't expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a cache entry
   */
  delete(key: string): void {
    this.cache.delete(key);
    if (this.localStorage) {
      try {
        this.localStorage.removeItem(`cache:${key}`);
      } catch (e) {
        console.warn('Failed to remove cache from localStorage:', e);
      }
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (this.localStorage) {
      try {
        const keys = Object.keys(this.localStorage);
        keys.forEach((key) => {
          if (key.startsWith('cache:')) {
            this.localStorage!.removeItem(key);
          }
        });
      } catch (e) {
        console.warn('Failed to clear localStorage cache:', e);
      }
    }
  }

  /**
   * Check if a request is allowed (cooldown check)
   * Returns true if enough time has passed since the last request for this URL
   */
  isRequestAllowed(url: string, cooldownMs: number = this.DEFAULT_COOLDOWN): boolean {
    const cooldown = this.requestCooldowns.get(url);

    if (!cooldown) {
      return true;
    }

    const timeSinceLastRequest = Date.now() - cooldown.lastRequestTime;
    return timeSinceLastRequest >= cooldown.cooldownMs;
  }

  /**
   * Update the last request time for a URL
   */
  recordRequest(url: string, cooldownMs: number = this.DEFAULT_COOLDOWN): void {
    this.requestCooldowns.set(url, {
      lastRequestTime: Date.now(),
      cooldownMs,
    });
  }

  /**
   * Get time remaining until next request is allowed (in milliseconds)
   */
  getCooldownRemaining(url: string): number {
    const cooldown = this.requestCooldowns.get(url);

    if (!cooldown) {
      return 0;
    }

    const timeSinceLastRequest = Date.now() - cooldown.lastRequestTime;
    const remaining = cooldown.cooldownMs - timeSinceLastRequest;

    return Math.max(0, remaining);
  }

  /**
   * Wait for cooldown to complete
   */
  async waitForCooldown(url: string): Promise<void> {
    const remaining = this.getCooldownRemaining(url);
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
  }

  /**
   * Persist cache entry to localStorage
   */
  private persistToLocalStorage(key: string, entry: CacheEntry<any>): void {
    if (!this.localStorage) return;

    try {
      const serialized = JSON.stringify(entry);
      this.localStorage.setItem(`cache:${key}`, serialized);
    } catch (e) {
      if (e instanceof DOMException && e.code === 22) {
        console.warn('LocalStorage quota exceeded');
        // Clear some old cache items
        this.clearOldestCache();
      } else {
        console.warn('Failed to persist cache to localStorage:', e);
      }
    }
  }

  /**
   * Load cache from localStorage
   */
  private loadFromLocalStorage(): void {
    if (!this.localStorage) return;

    try {
      const keys = Object.keys(this.localStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache:')) {
          const serialized = this.localStorage!.getItem(key);
          if (serialized) {
            const entry = JSON.parse(serialized);
            const cacheKey = key.substring(6); // Remove 'cache:' prefix

            // Only load if not expired
            if (Date.now() <= entry.expiresAt) {
              this.cache.set(cacheKey, entry);
            } else {
              this.localStorage!.removeItem(key);
            }
          }
        }
      });
    } catch (e) {
      console.warn('Failed to load cache from localStorage:', e);
    }
  }

  /**
   * Remove oldest cache entries when quota is exceeded
   */
  private clearOldestCache(): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp)
      .slice(0, Math.ceil(this.cache.size / 3)); // Remove oldest 1/3

    entries.forEach(([key]) => {
      this.delete(key);
    });
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      cooldownsActive: this.requestCooldowns.size,
    };
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();
