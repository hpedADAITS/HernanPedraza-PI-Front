import React, { useState, useEffect } from 'react';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton } from '@/components/settings/SettingsUI';
import { authAPI, participantsAPI } from '@/services/api';
import { readStoredJson, writeStoredJson } from '@/utils/storage';
import { useToast } from '@/hooks/useToast';
import { t } from '@/i18n';

interface DisplayNameModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function DisplayNameModal({ open, onClose, onSuccess }: DisplayNameModalProps) {
  const [newDisplayName, setNewDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const user = readStoredJson<{ displayName?: string }>('user');
      setNewDisplayName(user?.displayName || '');
    }
  }, [open]);

  const handleSave = async () => {
    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      toast.error(t('Display name must be at least 2 characters'));
      return;
    }
    setLoading(true);
    try {
      const displayName = newDisplayName.trim();
      await authAPI.updateProfile({ displayName });
      const user = readStoredJson<{ displayName?: string }>('user') || {};
      writeStoredJson('user', { ...user, displayName });
      const participant = readStoredJson<{ _id?: string; id?: string } & Record<string, unknown>>('currentParticipant');
      const participantId = participant?._id || participant?.id;
      if (participantId) {
        const updatedParticipant = await participantsAPI.updateProfile(participantId, { nickname: displayName });
        writeStoredJson('currentParticipant', { ...participant, ...updatedParticipant, nickname: displayName });
      }
      toast.success(t('Display name updated'));
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Failed to update display name'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsDialog open={open} title={t('Change Display Name')} onClose={onClose}>
      <input
        type="text"
        value={newDisplayName}
        onChange={(e) => setNewDisplayName(e.target.value)}
        aria-label={t('New display name')}
        placeholder={t('New display name')}
        className="h-12 w-full rounded-lg border border-slate-200 px-4 text-base text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
      />
      <SettingsDialogActions>
        <SettingsDialogButton onClick={onClose}>{t('Cancel')}</SettingsDialogButton>
        <SettingsDialogButton onClick={handleSave} disabled={loading} variant="primary">
          {loading ? t('Saving…') : t('Save')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}
