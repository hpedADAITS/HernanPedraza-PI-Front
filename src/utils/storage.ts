type StorageKey = 'user' | 'currentEvent' | 'currentParticipant';
type StorageMode = 'attendee' | 'dj';

export const STORAGE_KEYS: Record<StorageKey, string> = {
  user: 'user:v1',
  currentEvent: 'currentEvent:v1',
  currentParticipant: 'currentParticipant:v1',
};

const LEGACY_STORAGE_KEYS: Record<StorageKey, string> = {
  user: 'user',
  currentEvent: 'currentEvent',
  currentParticipant: 'currentParticipant',
};

function getCurrentStorageMode(): StorageMode | null {
  if (typeof window === 'undefined') return null;

  const { pathname } = window.location;
  if (pathname.startsWith('/attendee')) return 'attendee';
  if (pathname.startsWith('/dj')) return 'dj';
  return null;
}

function scopedKey(key: StorageKey, mode = getCurrentStorageMode()) {
  const versionedKey = STORAGE_KEYS[key];
  return mode ? `${mode}:${versionedKey}` : versionedKey;
}

function scopedLegacyKey(key: StorageKey, mode = getCurrentStorageMode()) {
  const legacyKey = LEGACY_STORAGE_KEYS[key];
  return mode ? `${mode}:${legacyKey}` : legacyKey;
}

/*
 * Session entities (user / currentEvent / currentParticipant) live in
 * sessionStorage under route-scoped keys so DJ and attendee routes cannot
 * inherit each other's identity/event/participant state.
 */
export function readStorageItem(key: StorageKey): string | null {
  const versionedKey = STORAGE_KEYS[key];
  const legacyKey = LEGACY_STORAGE_KEYS[key];
  const mode = getCurrentStorageMode();
  const currentScopedKey = scopedKey(key);
  const currentScopedLegacyKey = scopedLegacyKey(key);

  const sessionValue =
    sessionStorage.getItem(currentScopedKey) ??
    sessionStorage.getItem(currentScopedLegacyKey);
  if (sessionValue) {
    return sessionValue;
  }

  const localValue =
    localStorage.getItem(currentScopedKey) ??
    localStorage.getItem(currentScopedLegacyKey) ??
    (mode ? null : localStorage.getItem(versionedKey)) ??
    (mode ? null : localStorage.getItem(legacyKey));
  if (localValue) {
    sessionStorage.setItem(currentScopedKey, localValue);
    localStorage.removeItem(currentScopedKey);
    localStorage.removeItem(currentScopedLegacyKey);
    localStorage.removeItem(versionedKey);
    localStorage.removeItem(legacyKey);
    return localValue;
  }

  return null;
}

export function readStoredJson<T>(key: StorageKey): T | null {
  const raw = readStorageItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as T;

    const currentScopedKey = scopedKey(key);
    const currentScopedLegacyKey = scopedLegacyKey(key);
    if (sessionStorage.getItem(currentScopedKey) !== raw) {
      sessionStorage.setItem(currentScopedKey, raw);
      sessionStorage.removeItem(currentScopedLegacyKey);
    }

    return parsed;
  } catch {
    removeStoredItem(key);
    return null;
  }
}

export function writeStoredJson<T>(key: StorageKey, value: T) {
  const serialized = JSON.stringify(value);
  sessionStorage.setItem(scopedKey(key), serialized);
  sessionStorage.removeItem(scopedLegacyKey(key));
  /* Clear any legacy browser-wide copy so other tabs don't inherit it. */
  localStorage.removeItem(STORAGE_KEYS[key]);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}

export function removeStoredItem(key: StorageKey) {
  sessionStorage.removeItem(scopedKey(key));
  sessionStorage.removeItem(scopedLegacyKey(key));
  sessionStorage.removeItem(STORAGE_KEYS[key]);
  sessionStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
  localStorage.removeItem(scopedKey(key));
  localStorage.removeItem(scopedLegacyKey(key));
  localStorage.removeItem(STORAGE_KEYS[key]);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}
