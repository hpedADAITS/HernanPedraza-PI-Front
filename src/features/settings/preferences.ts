import { useState } from 'react';
import { readSettingJson, readSettingString, writeSettingJson, writeSettingString } from './storage';

export type MediaQuality = 'auto' | 'high' | 'medium' | 'low';

export interface ProfileSocialPrefs {
  showDisplayName: boolean;
  showProfilePicture: boolean;
  allowFriendRequests: boolean;
}

export interface AppSocialPrefs {
  allowNotifications: boolean;
  allowSharing: boolean;
}

export const MEDIA_QUALITY_OPTIONS: { value: MediaQuality; label: string }[] = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low (data saver)' },
];

export const DEFAULT_PROFILE_SOCIAL_PREFS: ProfileSocialPrefs = {
  showDisplayName: true,
  showProfilePicture: true,
  allowFriendRequests: true,
};

export function readProfileSocialPrefs(): ProfileSocialPrefs {
  return getInitialProfileSocialPrefs();
}

const DEFAULT_APP_SOCIAL_PREFS: AppSocialPrefs = {
  allowNotifications: true,
  allowSharing: true,
};

const isMediaQuality = (value: string | null): value is MediaQuality =>
  MEDIA_QUALITY_OPTIONS.some((option) => option.value === value);

const getInitialMediaQuality = (defaultValue: MediaQuality) => {
  const storedQuality = readSettingString('mediaQuality');
  return isMediaQuality(storedQuality) ? storedQuality : defaultValue;
};

const getInitialProfileSocialPrefs = () => ({
  ...DEFAULT_PROFILE_SOCIAL_PREFS,
  ...readSettingJson<Partial<ProfileSocialPrefs>>('socialPrefs'),
});

const getInitialAppSocialPrefs = () => {
  const storedSocial = readSettingJson<Partial<AppSocialPrefs>>('appSocialPrefs');
  if (storedSocial) return { ...DEFAULT_APP_SOCIAL_PREFS, ...storedSocial };

  return {
    allowNotifications:
      readSettingJson<boolean>('allowNotifications') ?? DEFAULT_APP_SOCIAL_PREFS.allowNotifications,
    allowSharing: readSettingJson<boolean>('allowSharing') ?? DEFAULT_APP_SOCIAL_PREFS.allowSharing,
  };
};

export function useMediaQualityPreference(defaultValue: MediaQuality = 'auto') {
  const [mediaQuality, setMediaQuality] = useState<MediaQuality>(() =>
    getInitialMediaQuality(defaultValue),
  );

  const saveMediaQuality = (value: MediaQuality) => {
    setMediaQuality(value);
    writeSettingString('mediaQuality', value);
  };

  return { mediaQuality, saveMediaQuality, setMediaQuality };
}

export function useProfileSocialPrefs() {
  const [socialPrefs, setSocialPrefs] = useState(getInitialProfileSocialPrefs);

  const saveSocialPrefs = (next: ProfileSocialPrefs) => {
    setSocialPrefs(next);
    writeSettingJson('socialPrefs', next);
  };

  return { saveSocialPrefs, setSocialPrefs, socialPrefs };
}

export function useAppSocialPrefs() {
  const [appSocialPrefs, setAppSocialPrefs] = useState(getInitialAppSocialPrefs);

  const saveAppSocialPrefs = (next: AppSocialPrefs) => {
    setAppSocialPrefs(next);
    writeSettingJson('appSocialPrefs', next);
  };

  return { appSocialPrefs, saveAppSocialPrefs, setAppSocialPrefs };
}
