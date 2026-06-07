type StorageKey = 'user' | 'currentEvent' | 'currentParticipant';

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

/*
 * Session entities (user / currentEvent / currentParticipant) live in
 * sessionStorage so each tab keeps an isolated session. A legacy fallback
 * migrates any value left in localStorage by older builds into this tab's
 * sessionStorage and then removes the browser-wide copy.
 */
export function readStorageItem(key: StorageKey): string | null {
  const versionedKey = STORAGE_KEYS[key];
  const legacyKey = LEGACY_STORAGE_KEYS[key];

  const sessionValue =
    sessionStorage.getItem(versionedKey) ?? sessionStorage.getItem(legacyKey);
  if (sessionValue) {
    return sessionValue;
  }

  const localValue =
    localStorage.getItem(versionedKey) ?? localStorage.getItem(legacyKey);
  if (localValue) {
    sessionStorage.setItem(versionedKey, localValue);
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

    const versionedKey = STORAGE_KEYS[key];
    const legacyKey = LEGACY_STORAGE_KEYS[key];
    if (sessionStorage.getItem(versionedKey) !== raw) {
      sessionStorage.setItem(versionedKey, raw);
      sessionStorage.removeItem(legacyKey);
    }

    return parsed;
  } catch {
    removeStoredItem(key);
    return null;
  }
}

export function writeStoredJson<T>(key: StorageKey, value: T) {
  const serialized = JSON.stringify(value);
  sessionStorage.setItem(STORAGE_KEYS[key], serialized);
  sessionStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
  /* Clear any legacy browser-wide copy so other tabs don't inherit it. */
  localStorage.removeItem(STORAGE_KEYS[key]);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}

export function removeStoredItem(key: StorageKey) {
  sessionStorage.removeItem(STORAGE_KEYS[key]);
  sessionStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
  localStorage.removeItem(STORAGE_KEYS[key]);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}
