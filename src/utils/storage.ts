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

export function readStorageItem(key: StorageKey): string | null {
  const versionedKey = STORAGE_KEYS[key];
  const legacyKey = LEGACY_STORAGE_KEYS[key];
  return localStorage.getItem(versionedKey) ?? localStorage.getItem(legacyKey);
}

export function readStoredJson<T>(key: StorageKey): T | null {
  const raw = readStorageItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as T;

    const versionedKey = STORAGE_KEYS[key];
    const legacyKey = LEGACY_STORAGE_KEYS[key];
    if (localStorage.getItem(versionedKey) !== raw) {
      localStorage.setItem(versionedKey, raw);
      localStorage.removeItem(legacyKey);
    }

    return parsed;
  } catch {
    removeStoredItem(key);
    return null;
  }
}

export function writeStoredJson<T>(key: StorageKey, value: T) {
  const serialized = JSON.stringify(value);
  localStorage.setItem(STORAGE_KEYS[key], serialized);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}

export function removeStoredItem(key: StorageKey) {
  localStorage.removeItem(STORAGE_KEYS[key]);
  localStorage.removeItem(LEGACY_STORAGE_KEYS[key]);
}
