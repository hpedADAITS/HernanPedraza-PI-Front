import React, { useState, useEffect } from 'react';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton } from '@/components/settings/SettingsUI';
import { ProfilePictureUpload } from '@/components/common';
import { readStoredJson } from '@/utils/storage';
import { t } from '@/i18n';

interface ProfilePictureModalProps {
  open: boolean;
  onClose: () => void;
}

export function ProfilePictureModal({ open, onClose }: ProfilePictureModalProps) {
  const [currentPicture, setCurrentPicture] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const picture = readStoredJson<{ profilePicture?: string | null }>('user')?.profilePicture || null;
      setCurrentPicture(picture);
    }
  }, [open]);

  return (
    <SettingsDialog open={open} title="Profile Picture" onClose={onClose}>
      <div className="mb-6 flex justify-center">
        <ProfilePictureUpload
          currentPicture={currentPicture}
          onPictureUpdated={(newPicture) => {
            setCurrentPicture(newPicture);
            onClose();
          }}
          size="lg"
        />
      </div>
      <SettingsDialogActions>
        <SettingsDialogButton onClick={onClose} className="w-full flex-none">
          {t('Done')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}
