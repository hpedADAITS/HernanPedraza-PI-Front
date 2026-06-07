import React from 'react';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton } from '@/components/settings/SettingsUI';
import { getSocket } from '@/services/socket';
import { getToken } from '@/services/api/client';
import { readStoredJson } from '@/utils/storage';
import { t } from '@/i18n';

interface DebugInfoModalProps {
  open: boolean;
  onClose: () => void;
}

export function DebugInfoModal({ open, onClose }: DebugInfoModalProps) {
  const hasToken = !!getToken();
  const eventData = readStoredJson<{ eventId?: string }>('currentEvent');
  const participantData = readStoredJson<{ _id?: string }>('currentParticipant');
  const eventId = eventData?.eventId || t('None');
  const participantId = participantData?._id || t('None');
  const socketConnected = getSocket()?.connected || false;

  return (
    <SettingsDialog open={open} title={t('Debug Info')} onClose={onClose}>
      <div className="space-y-3 text-sm font-mono">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('Auth Token')}:</span>
          <span className={hasToken ? 'text-green-600' : 'text-red-500'}>
            {hasToken ? t('Present') : t('Missing')}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('Event ID')}:</span>
          <span className="max-w-[180px] truncate text-slate-700">{eventId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('Participant ID')}:</span>
          <span className="max-w-[180px] truncate text-slate-700">{participantId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">{t('Socket')}:</span>
          <span className={socketConnected ? 'text-green-600' : 'text-red-500'}>
            {socketConnected ? t('Connected') : t('Disconnected')}
          </span>
        </div>
      </div>
      <SettingsDialogActions>
        <SettingsDialogButton onClick={onClose} className="w-full flex-none">
          {t('Close')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}
