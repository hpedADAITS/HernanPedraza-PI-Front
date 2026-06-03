import { useEffect, useState } from 'react';
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

const DEFAULT_APP_SOCIAL_PREFS: AppSocialPrefs = {
  allowNotifications: true,
  allowSharing: true,
};

const isMediaQuality = (value: string | null): value is MediaQuality =>
  MEDIA_QUALITY_OPTIONS.some((option) => option.value === value);

export function useMediaQualityPreference(defaultValue: MediaQuality = 'auto') {
  const [mediaQuality, setMediaQuality] = useState<MediaQuality>(defaultValue);

  useEffect(() => {
    const storedQuality = readSettingString('mediaQuality');
    if (isMediaQuality(storedQuality)) setMediaQuality(storedQuality);
  }, []);

  const saveMediaQuality = (value: MediaQuality) => {
    setMediaQuality(value);
    writeSettingString('mediaQuality', value);
  };

  return { mediaQuality, saveMediaQuality, setMediaQuality };
}

export function useProfileSocialPrefs() {
  const [socialPrefs, setSocialPrefs] = useState(DEFAULT_PROFILE_SOCIAL_PREFS);

  useEffect(() => {
    const storedSocial = readSettingJson<Partial<ProfileSocialPrefs>>('socialPrefs');
    if (storedSocial) {
      setSocialPrefs({ ...DEFAULT_PROFILE_SOCIAL_PREFS, ...storedSocial });
    }
  }, []);

  const saveSocialPrefs = (next: ProfileSocialPrefs) => {
    setSocialPrefs(next);
    writeSettingJson('socialPrefs', next);
  };

  return { saveSocialPrefs, setSocialPrefs, socialPrefs };
}

export function useAppSocialPrefs() {
  const [appSocialPrefs, setAppSocialPrefs] = useState(DEFAULT_APP_SOCIAL_PREFS);

  useEffect(() => {
    const storedSocial = readSettingJson<Partial<AppSocialPrefs>>('appSocialPrefs');
    if (storedSocial) {
      setAppSocialPrefs({ ...DEFAULT_APP_SOCIAL_PREFS, ...storedSocial });
      return;
    }

    const allowNotifications = readSettingJson<boolean>('allowNotifications');
    const allowSharing = readSettingJson<boolean>('allowSharing');
    setAppSocialPrefs({
      allowNotifications: allowNotifications ?? DEFAULT_APP_SOCIAL_PREFS.allowNotifications,
      allowSharing: allowSharing ?? DEFAULT_APP_SOCIAL_PREFS.allowSharing,
    });
  }, []);

  const saveAppSocialPrefs = (next: AppSocialPrefs) => {
    setAppSocialPrefs(next);
    writeSettingJson('appSocialPrefs', next);
  };

  return { appSocialPrefs, saveAppSocialPrefs, setAppSocialPrefs };
}
