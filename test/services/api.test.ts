import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadToken, saveToken, clearToken, API_BASE, eventsAPI } from '@/services/api';
import { getToken } from '@/services/api/client';

function tokenWithRole(role: 'ATTENDEE' | 'DJ') {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  const payload = encode({ userId: `${role}-1`, role });
  return `${encode({ alg: 'none' })}.${payload}.sig`;
}

describe('API Service', () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      window.history.replaceState({}, '', '/');
    }
  });

  describe('Token Management', () => {
    it('saves attendee tokens to attendee session storage', () => {
      window.history.replaceState({}, '', '/attendee/login');
      const testToken = tokenWithRole('ATTENDEE');
      saveToken(testToken);

      expect(sessionStorage.getItem('attendee:authToken:v1')).toBe(testToken);
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('keeps DJ and attendee tokens independent by route', () => {
      const attendeeToken = tokenWithRole('ATTENDEE');
      const djToken = tokenWithRole('DJ');

      window.history.replaceState({}, '', '/attendee/dashboard');
      saveToken(attendeeToken);

      window.history.replaceState({}, '', '/dj/dashboard');
      saveToken(djToken);

      expect(getToken()).toBe(djToken);

      window.history.replaceState({}, '', '/attendee/dashboard');
      expect(getToken()).toBe(attendeeToken);
    });

    it('migrates legacy localStorage tokens without leaking roles across routes', () => {
      const djToken = tokenWithRole('DJ');
      localStorage.setItem('authToken', djToken);

      window.history.replaceState({}, '', '/attendee/dashboard');
      loadToken();
      expect(getToken()).toBeNull();

      window.history.replaceState({}, '', '/dj/dashboard');
      expect(getToken()).toBe(djToken);
      expect(localStorage.getItem('authToken')).toBeNull();
    });

    it('loads unscoped session tokens outside role routes', () => {
      const testToken = 'test-jwt-token-12345';
      sessionStorage.setItem('authToken:v1', testToken);
      loadToken();

      expect(getToken()).toBe(testToken);
    });

    it('clears only the current route token', () => {
      const attendeeToken = tokenWithRole('ATTENDEE');
      const djToken = tokenWithRole('DJ');

      window.history.replaceState({}, '', '/attendee/dashboard');
      saveToken(attendeeToken);

      window.history.replaceState({}, '', '/dj/dashboard');
      saveToken(djToken);

      clearToken();
      expect(sessionStorage.getItem('dj:authToken:v1')).toBeNull();

      window.history.replaceState({}, '', '/attendee/dashboard');
      expect(getToken()).toBe(attendeeToken);
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

    it('does not send localhost as a phone microphone frontend origin', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            link: 'http://192.168.1.50:5173/dj/microphone/event-1?token=abc',
          },
        }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await eventsAPI.getPhoneMicrophoneLink('event-1');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/events\/event-1\/phone-microphone-link$/),
        expect.any(Object),
      );
    });

    it('sends phone microphone tokens in the body without auth headers', async () => {
      saveToken(tokenWithRole('DJ'));
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { microphone: { eventId: 'event-1' } } }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await eventsAPI.connectPhoneMicrophone('event-1', 'Android microphone', 'phone-token');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/events/event-1/phone-microphone/connect'),
        expect.objectContaining({
          body: JSON.stringify({ deviceName: 'Android microphone', token: 'phone-token' }),
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });

    it('sends matched track phone tokens in the body without auth headers', async () => {
      saveToken(tokenWithRole('DJ'));
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { song: { id: 'song-1' } } }),
      });
      vi.stubGlobal('fetch', fetchMock);

      await eventsAPI.sendMatchedAudioTrackNow('event-1', 'track-1', 'phone-token');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/events/event-1/audio-tracks/track-1/send-now'),
        expect.objectContaining({
          body: JSON.stringify({ token: 'phone-token' }),
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    });
  });

  describe('Token Lifecycle', () => {
    it('should handle complete token lifecycle', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';

      /* Save first token */
      saveToken(token1);
      expect(sessionStorage.getItem('authToken:v1')).toBe(token1);

      /* Update with new token */
      saveToken(token2);
      expect(sessionStorage.getItem('authToken:v1')).toBe(token2);

      /* Clear token */
      clearToken();
      expect(sessionStorage.getItem('authToken:v1')).toBeNull();
    });

    it('should persist token across loadToken calls', () => {
      const testToken = 'persistent-token';
      saveToken(testToken);

      /* Simulate page reload */
      loadToken();
      expect(getToken()).toBe(testToken);

      /* Load again */
      loadToken();
      expect(getToken()).toBe(testToken);
    });
  });
});
