import React from 'react';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton, SettingsToggleRow } from '@/components/settings/SettingsUI';
import { useProfileSocialPrefs } from '@/features/settings/preferences';
import { useToast } from '@/hooks/useToast';
import { readStoredJson } from '@/utils/storage';
import { participantsAPI } from '@/services/api';
import { t } from '@/i18n';

interface SocialSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export function SocialSettingsModal({ open, onClose }: SocialSettingsModalProps) {
  const { saveSocialPrefs, socialPrefs } = useProfileSocialPrefs();
  const { toast } = useToast();

  const handleToggle = async (key: keyof typeof socialPrefs) => {
    const next = { ...socialPrefs, [key]: !socialPrefs[key] };
    saveSocialPrefs(next);

    /* Push the same state to the server-side participant row so other
       clients in the event see the masked nickname/profile picture (and the
       back end remembers across socket reconnects within this session). The
       current user is the only one we sync — toggles are a personal choice
       that should not touch anyone else's row. */
    try {
      const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
      const participantId = participant?._id || participant?.id;
      if (!participantId) return;
      await participantsAPI.updateProfile(participantId, {
        socialPrefs: {
          showDisplayName: next.showDisplayName,
          showProfilePicture: next.showProfilePicture,
          allowFriendRequests: next.allowFriendRequests,
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('Failed to sync social preferences'),
      );
    }
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
