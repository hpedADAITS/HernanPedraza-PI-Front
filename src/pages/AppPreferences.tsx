import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Music2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { SettingsChoiceRow, SettingsDialog, SettingsDialogActions, SettingsDialogButton, SettingsGrid, SettingsOptionCard, SettingsPageShell, SettingsToggleRow } from '@/components/settings/SettingsUI';
import { MEDIA_QUALITY_OPTIONS, useAppSocialPrefs, useMediaQualityPreference } from '@/features/settings/preferences';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

const APP_SETTINGS_OPTIONS = [
  {
    label: 'Media Quality',
    icon: Music2,
    onClickKey: 'mediaQuality',
  },
  {
    label: 'Social Settings',
    icon: Users,
    onClickKey: 'socialSettings',
  },
] as const;

const APP_MEDIA_QUALITY_OPTIONS = MEDIA_QUALITY_OPTIONS.filter(
  ({ value }) => value !== 'auto',
);

export function AppPreferences({ mode, onNavigate }: Props) {
  const [showMediaQuality, setShowMediaQuality] = useState(false);
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const { mediaQuality, saveMediaQuality, setMediaQuality } =
    useMediaQualityPreference('high');
  const { appSocialPrefs, saveAppSocialPrefs, setAppSocialPrefs } =
    useAppSocialPrefs();

  const handleMediaQualitySave = () => {
    saveMediaQuality(mediaQuality);
    toast.success(t('Media quality set to {quality}', { quality: t(mediaQuality) }));
    setShowMediaQuality(false);
  };

  const handleSocialSettingsSave = () => {
    saveAppSocialPrefs(appSocialPrefs);
    toast.success(t('Social settings updated'));
    setShowSocialSettings(false);
  };

  const toggleAppSocialPref = (key: keyof typeof appSocialPrefs) => {
    setAppSocialPrefs((value) => ({ ...value, [key]: !value[key] }));
  };

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <SettingsPageShell
        title={t('App Settings')}
        onBack={() =>
          onNavigate(mode === 'dj' ? 'dj-settings' : 'attendee-settings')
        }
        backLabel={t('Cancel')}
      >
        <SettingsGrid className="mt-32 md:mt-36">
          {APP_SETTINGS_OPTIONS.map((option) => (
            <SettingsOptionCard
              key={option.label}
              label={t(option.label)}
              icon={option.icon}
              onClick={() => {
                if (option.onClickKey === 'mediaQuality') {
                  setShowMediaQuality(true);
                  return;
                }
                setShowSocialSettings(true);
              }}
            />
          ))}
        </SettingsGrid>
      </SettingsPageShell>

      <SettingsDialog
        open={showMediaQuality}
        title={t('Media Quality')}
        onClose={() => setShowMediaQuality(false)}
      >
        <div className="mb-6 flex flex-col gap-2">
          {APP_MEDIA_QUALITY_OPTIONS.map(({ value, label }) => (
            <SettingsChoiceRow
              key={value}
              selected={mediaQuality === value}
              onClick={() => setMediaQuality(value)}
            >
              <span className="capitalize">{t(label)}</span>
            </SettingsChoiceRow>
          ))}
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setShowMediaQuality(false)}>
            {t('Cancel')}
          </SettingsDialogButton>
          <SettingsDialogButton
            onClick={handleMediaQualitySave}
            variant="primary"
          >
            {t('Save')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showSocialSettings}
        title={t('Social Settings')}
        onClose={() => setShowSocialSettings(false)}
      >
        <div className="mb-6 flex flex-col gap-3">
          <SettingsToggleRow
            label={t('Allow notifications')}
            checked={appSocialPrefs.allowNotifications}
            onChange={() => toggleAppSocialPref('allowNotifications')}
          />
          <SettingsToggleRow
            label={t('Allow sharing')}
            checked={appSocialPrefs.allowSharing}
            onChange={() => toggleAppSocialPref('allowSharing')}
          />
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setShowSocialSettings(false)}>
            {t('Cancel')}
          </SettingsDialogButton>
          <SettingsDialogButton
            onClick={handleSocialSettingsSave}
            variant="primary"
          >
            {t('Save')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>
    </Layout>
  );
}
