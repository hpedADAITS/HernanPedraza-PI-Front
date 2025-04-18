import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Music2, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  SettingsChoiceRow,
  SettingsDialog,
  SettingsDialogActions,
  SettingsDialogButton,
  SettingsGrid,
  SettingsOptionCard,
  SettingsPageShell,
  SettingsToggleRow,
} from '@/components/settings/SettingsUI';
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

export function AppPreferences({ mode, onNavigate }: Props) {
  const [showMediaQuality, setShowMediaQuality] = useState(false);
  const [showSocialSettings, setShowSocialSettings] = useState(false);
  const [mediaQuality, setMediaQuality] = useState('high');
  const [allowNotifications, setAllowNotifications] = useState(true);
  const [allowSharing, setAllowSharing] = useState(true);

  const handleMediaQualitySave = () => {
    localStorage.setItem('mediaQuality', mediaQuality);
    toast.success(`Media quality set to ${mediaQuality}`);
    setShowMediaQuality(false);
  };

  const handleSocialSettingsSave = () => {
    localStorage.setItem(
      'allowNotifications',
      JSON.stringify(allowNotifications),
    );
    localStorage.setItem('allowSharing', JSON.stringify(allowSharing));
    toast.success('Social settings updated');
    setShowSocialSettings(false);
  };

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <SettingsPageShell
        title="App Settings"
        onBack={() =>
          onNavigate(mode === 'dj' ? 'dj-settings' : 'attendee-settings')
        }
        backLabel="Cancel"
      >
        <SettingsGrid className="mt-32 md:mt-36">
          {APP_SETTINGS_OPTIONS.map((option) => (
            <SettingsOptionCard
              key={option.label}
              label={option.label}
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
        title="Media Quality"
        onClose={() => setShowMediaQuality(false)}
      >
        <div className="mb-6 flex flex-col gap-2">
          {['low', 'medium', 'high'].map((quality) => (
            <SettingsChoiceRow
              key={quality}
              selected={mediaQuality === quality}
              onClick={() => setMediaQuality(quality)}
            >
              <span className="capitalize">{quality}</span>
            </SettingsChoiceRow>
          ))}
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setShowMediaQuality(false)}>
            Cancel
          </SettingsDialogButton>
          <SettingsDialogButton
            onClick={handleMediaQualitySave}
            variant="primary"
          >
            Save
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showSocialSettings}
        title="Social Settings"
        onClose={() => setShowSocialSettings(false)}
      >
        <div className="mb-6 flex flex-col gap-3">
          <SettingsToggleRow
            label="Allow notifications"
            checked={allowNotifications}
            onChange={() => setAllowNotifications((value) => !value)}
          />
          <SettingsToggleRow
            label="Allow sharing"
            checked={allowSharing}
            onChange={() => setAllowSharing((value) => !value)}
          />
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setShowSocialSettings(false)}>
            Cancel
          </SettingsDialogButton>
          <SettingsDialogButton
            onClick={handleSocialSettingsSave}
            variant="primary"
          >
            Save
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>
    </Layout>
  );
}
