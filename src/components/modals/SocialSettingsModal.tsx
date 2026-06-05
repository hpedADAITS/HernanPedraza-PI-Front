import React from 'react';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton, SettingsToggleRow } from '@/components/settings/SettingsUI';
import { useProfileSocialPrefs } from '@/features/settings/preferences';
import { t } from '@/i18n';

interface SocialSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialSettingsModal({ open, onClose }: SocialSettingsModalProps) {
  const { saveSocialPrefs, socialPrefs } = useProfileSocialPrefs();

  const handleToggle = (key: keyof typeof socialPrefs) => {
    const next = { ...socialPrefs, [key]: !socialPrefs[key] };
    saveSocialPrefs(next);
  };

  return (
    <SettingsDialog open={open} title={t('Social Settings')} onClose={onClose}>
      <div className="flex flex-col gap-3">
        {(
          [
            ['showDisplayName', 'Show display name'],
            ['showProfilePicture', 'Show profile picture'],
            ['allowFriendRequests', 'Allow friend requests'],
          ] as [keyof typeof socialPrefs, string][]
        ).map(([key, label]) => (
          <SettingsToggleRow
            key={key}
            label={t(label)}
            checked={socialPrefs[key]}
            onChange={() => handleToggle(key)}
          />
        ))}
      </div>
      <SettingsDialogActions>
        <SettingsDialogButton onClick={onClose} className="w-full flex-none">
          {t('Done')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}
