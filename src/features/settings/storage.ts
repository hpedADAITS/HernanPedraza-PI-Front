const SETTINGS_KEYS = {
  mediaQuality: 'mediaQuality',
  socialPrefs: 'socialPrefs',
  appSocialPrefs: 'appSocialPrefs',
  allowNotifications: 'allowNotifications',
  allowSharing: 'allowSharing',
} as const;

type SettingsKey = keyof typeof SETTINGS_KEYS;

function getKey(key: SettingsKey) {
  return SETTINGS_KEYS[key];
}

export function readSettingString(key: SettingsKey): string | null {
  return localStorage.getItem(getKey(key));
}

export function writeSettingString(key: SettingsKey, value: string) {
  localStorage.setItem(getKey(key), value);
}

export function readSettingJson<T>(key: SettingsKey): T | null {
  const raw = readSettingString(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    localStorage.removeItem(getKey(key));
    return null;
  }
}

export function writeSettingJson<T>(key: SettingsKey, value: T) {
  writeSettingString(key, JSON.stringify(value));
}
