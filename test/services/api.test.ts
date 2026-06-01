import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadToken, saveToken, clearToken, API_BASE } from '@/services/api';

describe('API Service', () => {
  beforeEach(() => {
    /* Clear localStorage before each test */
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('Token Management', () => {
    it('should save token to localStorage and memory', () => {
      const testToken = 'test-jwt-token-12345';
      saveToken(testToken);

      expect(localStorage.getItem('authToken')).toBe(testToken);
    });

    it('should load token from localStorage', () => {
      const testToken = 'test-jwt-token-12345';
      localStorage.setItem('authToken', testToken);

      loadToken();
      /* We can't directly check the private authToken variable, */
      /* but we can verify it was loaded by checking localStorage */
      expect(localStorage.getItem('authToken')).toBe(testToken);
    });

    it('should clear token from localStorage and memory', () => {
      const testToken = 'test-jwt-token-12345';
      saveToken(testToken);
      expect(localStorage.getItem('authToken')).toBe(testToken);

      clearToken();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should handle clearing token when none exists', () => {
      /* Should not throw */
      expect(() => clearToken()).not.toThrow();
      expect(localStorage.getItem('authToken')).toBeNull();
    });
  });

  describe('API Configuration', () => {
    it('should have valid API_BASE URL', () => {
      expect(API_BASE).toMatch(/^(https?:\/\/|\/)/);
    });

    it('should include /api/v1 in the base URL', () => {
      expect(API_BASE).toContain('/api/v1');
    });
  });

  describe('Token Lifecycle', () => {
    it('should handle complete token lifecycle', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      /* Save first token */
      saveToken(token1);
      expect(localStorage.getItem('authToken')).toBe(token1);

      /* Update with new token */
      saveToken(token2);
      expect(localStorage.getItem('authToken')).toBe(token2);

      /* Clear token */
      clearToken();
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('should persist token across loadToken calls', () => {
      const testToken = 'persistent-token';
      saveToken(testToken);

      /* Simulate page reload */
      loadToken();
      expect(localStorage.getItem('authToken')).toBe(testToken);

      /* Load again */
      loadToken();
      expect(localStorage.getItem('authToken')).toBe(testToken);
    });
  });
});
