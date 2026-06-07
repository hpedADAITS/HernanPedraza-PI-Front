import { beforeEach, describe, expect, it } from 'vitest';
import { readStoredJson, removeStoredItem, writeStoredJson } from '@/utils/storage';

describe('route-scoped storage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('keeps DJ and attendee session entities independent', () => {
    window.history.replaceState({}, '', '/attendee/dashboard');
    writeStoredJson('user', { role: 'ATTENDEE', displayName: 'Guest' });

    window.history.replaceState({}, '', '/dj/dashboard');
    writeStoredJson('user', { role: 'DJ', displayName: 'DJ' });

    expect(readStoredJson<{ role: string }>('user')?.role).toBe('DJ');

    window.history.replaceState({}, '', '/attendee/dashboard');
    expect(readStoredJson<{ role: string }>('user')?.role).toBe('ATTENDEE');
  });

  it('clears only the current route session entity', () => {
    window.history.replaceState({}, '', '/attendee/dashboard');
    writeStoredJson('currentEvent', { eventId: 'attendee-event' });

    window.history.replaceState({}, '', '/dj/dashboard');
    writeStoredJson('currentEvent', { eventId: 'dj-event' });
    removeStoredItem('currentEvent');

    expect(readStoredJson('currentEvent')).toBeNull();

    window.history.replaceState({}, '', '/attendee/dashboard');
    expect(readStoredJson<{ eventId: string }>('currentEvent')?.eventId).toBe(
      'attendee-event',
    );
  });

  it('does not read browser-wide legacy data inside role routes', () => {
    localStorage.setItem('user:v1', JSON.stringify({ role: 'ATTENDEE' }));

    window.history.replaceState({}, '', '/attendee/dashboard');
    expect(readStoredJson('user')).toBeNull();
  });

  it('still reads browser-wide data outside role routes', () => {
    localStorage.setItem('user:v1', JSON.stringify({ role: 'ATTENDEE' }));

    expect(readStoredJson<{ role: string }>('user')?.role).toBe('ATTENDEE');
  });
});
