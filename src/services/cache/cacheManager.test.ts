import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cacheManager } from './cacheManager';

describe('cacheManager', () => {
  beforeEach(() => {
    cacheManager.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('set/get/has', () => {
    it('should set and get cache entries', () => {
      const data = { id: 1, name: 'test' };
      cacheManager.set('test-key', data);

      expect(cacheManager.get('test-key')).toEqual(data);
      expect(cacheManager.has('test-key')).toBe(true);
    });

    it('should return null for non-existent keys', () => {
      expect(cacheManager.get('non-existent')).toBeNull();
      expect(cacheManager.has('non-existent')).toBe(false);
    });

    it('should expire cache entries after TTL', () => {
      const data = { id: 1 };
      cacheManager.set('test-key', data, 1000); // 1 second TTL

      expect(cacheManager.get('test-key')).toEqual(data);

      vi.advanceTimersByTime(1100);

      expect(cacheManager.get('test-key')).toBeNull();
      expect(cacheManager.has('test-key')).toBe(false);
    });
  });

  describe('delete', () => {
    it('should delete cache entries', () => {
      cacheManager.set('test-key', { id: 1 });
      expect(cacheManager.has('test-key')).toBe(true);

      cacheManager.delete('test-key');

      expect(cacheManager.has('test-key')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
      cacheManager.set('key1', { id: 1 });
      cacheManager.set('key2', { id: 2 });
      cacheManager.set('key3', { id: 3 });

      cacheManager.clear();

      expect(cacheManager.has('key1')).toBe(false);
      expect(cacheManager.has('key2')).toBe(false);
      expect(cacheManager.has('key3')).toBe(false);
    });
  });

  describe('Request cooldown', () => {
    it('should allow first request', () => {
      expect(cacheManager.isRequestAllowed('/api/test')).toBe(true);
    });

    it('should block request within cooldown period', () => {
      cacheManager.recordRequest('/api/test', 1000); // 1 second cooldown

      expect(cacheManager.isRequestAllowed('/api/test', 1000)).toBe(false);
    });

    it('should allow request after cooldown expires', () => {
      cacheManager.recordRequest('/api/test', 1000);

      vi.advanceTimersByTime(1100);

      expect(cacheManager.isRequestAllowed('/api/test', 1000)).toBe(true);
    });

    it('should return remaining cooldown time', () => {
      cacheManager.recordRequest('/api/test', 1000);

      const remaining = cacheManager.getCooldownRemaining('/api/test');
      expect(remaining).toBeGreaterThan(900);
      expect(remaining).toBeLessThanOrEqual(1000);
    });

    it('should return 0 for no cooldown', () => {
      expect(cacheManager.getCooldownRemaining('/api/no-cooldown')).toBe(0);
    });
  });

  describe('waitForCooldown', () => {
    it('should resolve immediately if no cooldown', async () => {
      await cacheManager.waitForCooldown('/api/no-pending-cooldown');
      // If it doesn't timeout, the test passes
      expect(true).toBe(true);
    });

    it('should wait for cooldown to complete', async () => {
      cacheManager.recordRequest('/api/test', 1000);

      const promise = cacheManager.waitForCooldown('/api/test');

      vi.advanceTimersByTime(500);
      // Still waiting
      let resolved = false;
      promise.then(() => {
        resolved = true;
      });
      expect(resolved).toBe(false);

      vi.advanceTimersByTime(600);
      // Should be resolved now
      await promise;
      expect(resolved).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      // Just test that stats are returned and increase with new cache/cooldowns
      const initialStats = cacheManager.getStats();
      
      cacheManager.set('stat-key1', { id: 1 });
      cacheManager.recordRequest('/api/stattest1', 1000);

      const newStats = cacheManager.getStats();
      
      expect(newStats.cacheSize).toBeGreaterThan(initialStats.cacheSize);
      expect(newStats.cooldownsActive).toBeGreaterThan(initialStats.cooldownsActive);
    });
  });

  describe('TTL edge cases', () => {
    it('should use default TTL if not specified', () => {
      const data = { id: 1 };
      cacheManager.set('test-key', data);

      // Should still be cached after 1 second
      vi.advanceTimersByTime(1000);
      expect(cacheManager.get('test-key')).toEqual(data);

      // Should expire after 5 minutes (default)
      vi.advanceTimersByTime(5 * 60 * 1000);
      expect(cacheManager.get('test-key')).toBeNull();
    });

    it('should handle zero TTL (session cache)', () => {
      const data = { id: 1 };
      cacheManager.set('zero-ttl-key', data, 0);

      // Immediately expired (or expires before get call)
      vi.advanceTimersByTime(1);
      expect(cacheManager.get('zero-ttl-key')).toBeNull();
    });

    it('should handle very large TTL', () => {
      const data = { id: 1 };
      const oneDayMs = 24 * 60 * 60 * 1000;
      cacheManager.set('test-key', data, oneDayMs);

      // Should still be cached
      vi.advanceTimersByTime(oneDayMs - 1000);
      expect(cacheManager.get('test-key')).toEqual(data);
    });
  });

  describe('Type safety', () => {
    it('should preserve data types', () => {
      const string = 'test';
      const number = 42;
      const boolean = true;
      const object = { key: 'value' };
      const array = [1, 2, 3];

      cacheManager.set('string', string);
      cacheManager.set('number', number);
      cacheManager.set('boolean', boolean);
      cacheManager.set('object', object);
      cacheManager.set('array', array);

      expect(cacheManager.get('string')).toBe(string);
      expect(cacheManager.get('number')).toBe(number);
      expect(cacheManager.get('boolean')).toBe(boolean);
      expect(cacheManager.get('object')).toEqual(object);
      expect(cacheManager.get('array')).toEqual(array);
    });
  });
});
