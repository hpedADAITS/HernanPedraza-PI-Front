import React, { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Zap, UserX, Play } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SettingsDialog, SettingsDialogActions, SettingsDialogButton } from '@/components/settings/SettingsUI';
import { COOLDOWN_OPTIONS, DEFAULT_COOLDOWN_MS, formatCooldownDuration } from '@/constants/cooldowns';
import { useSound } from '@/hooks/useSound';
import { setCooldownAck, clearCooldownAck, kickParticipantAck } from '@/services/socket/emitters';
import { useToast } from '@/hooks/useToast';
import { UserAvatar } from '@/components/common';
import { t } from '@/i18n';

export interface ConnectedUser {
  _id: string;
  id?: string;
  nickname: string;
  profilePicture?: string | null;
  userId?:
    | string
    | {
        _id?: string;
        id?: string;
        profilePicture?: string | null;
      }
    | null;
  role?: string;
  joinedAt: string;
  socketId?: string;
  isPremium?: boolean;
  cooldownUntil?: Date | string;
}

export function getParticipantProfilePicture(participant: ConnectedUser) {
  return participant.profilePicture
    ?? (typeof participant.userId === 'object'
      ? participant.userId?.profilePicture
      : null)
    ?? null;
}

export function participantUserId(participant: ConnectedUser) {
  if (typeof participant.userId === 'string') return participant.userId;
  return participant.userId?._id ?? participant.userId?.id ?? null;
}

export function participantId(participant: ConnectedUser) {
  return participant._id ?? participant.id;
}

export function isDjParticipant(
  participant: ConnectedUser,
  djParticipantId: string | null,
  djUserId: string | null,
) {
  const userId = participantUserId(participant);
  const id = participantId(participant);
  return participant.role === 'dj'
    || (!!djParticipantId
      && (id === djParticipantId || userId === djParticipantId))
    || (!!djUserId && userId === djUserId);
}

function formatTimeAgo(joinedAt: string): string {
  const secondsAgo = Math.floor((Date.now() - new Date(joinedAt).getTime()) / 1000);
  return secondsAgo < 60
    ? `${secondsAgo}s ago`
    : secondsAgo < 3600
      ? `${Math.floor(secondsAgo / 60)}m ago`
      : `${Math.floor(secondsAgo / 3600)}h ago`;
}

export interface ParticipantItemProps {
  participant: ConnectedUser;
  isSelected: boolean;
  onSelect: (id: string | null) => void;
  onRemove: (id: string) => void;
  onCooldownChange: (id: string, cooldownUntil?: Date | string | null) => void;
  eventId: string | null;
}

export function ParticipantItem({
  participant,
  isSelected,
  onSelect,
  onRemove,
  onCooldownChange,
  eventId,
}: ParticipantItemProps) {
  const [cooldownMs, setCooldownMs] = useState(DEFAULT_COOLDOWN_MS);
  const [cooldownDialogOpen, setCooldownDialogOpen] = useState(false);
  const [cooldownReason, setCooldownReason] = useState('DJ cooldown');
  const { playSound } = useSound();
  const toast = useToast();
  const id = participantId(participant);

  const isOnCooldown = participant.cooldownUntil && new Date(participant.cooldownUntil) > new Date();

  const applyCooldown = async () => {
    if (!id || !eventId) return;
    const reason = cooldownReason.trim() || 'DJ cooldown';
    playSound('cooldown');

    try {
      const promise = setCooldownAck(eventId, id, cooldownMs, reason);
      const result = await toast.promise(promise, {
        success: t('Cooldown applied to "{name}" for {duration}', {
          name: participant.nickname,
          duration: formatCooldownDuration(cooldownMs),
        }),
        error: t('Failed to apply cooldown'),
      });
      onCooldownChange(
        id,
        (result as { cooldownUntil?: Date | string | null })?.cooldownUntil
          ?? new Date(Date.now() + cooldownMs),
      );
      setCooldownDialogOpen(false);
    } catch (error: unknown) {
      console.error('Error executing Cooldown:', error);
    }
  };

  const handleAdminAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id) return;

    try {
      if (action === 'Cooldown' && eventId) {
        if (isOnCooldown) {
          playSound('cooldown');
          const promise = clearCooldownAck(eventId, id);
          await toast.promise(promise, {
            success: t('Cooldown removed for "{name}"', { name: participant.nickname }),
            error: t('Failed to remove cooldown'),
          });
          onCooldownChange(id, null);
        } else {
          setCooldownDialogOpen(true);
        }
      } else if (action === 'Kick' && eventId) {
        playSound('cancelAction');
        const promise = kickParticipantAck(eventId, id, 'Kicked by DJ');
        await toast.promise(promise, {
          success: t('Kicked "{name}"', { name: participant.nickname }),
          error: t('Failed to kick'),
        });
        onRemove(id);
        onSelect(null);
      }
    } catch (error: unknown) {
      console.error(`Error executing ${action}:`, error);
    }
  };

  return (
    <m.div
      layout
      exit={{
        opacity: 0,
        x: 20,
        scale: 0.95,
        transition: { duration: 0.3 },
      }}
      onClick={() => onSelect(id ?? null)}
      className="bg-slate-50 rounded-xl p-3 lg:p-2 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <UserAvatar
          name={participant.nickname}
          profilePicture={getParticipantProfilePicture(participant)}
          imageAlt={t('{name} profile', { name: participant.nickname })}
          className="w-10 h-10 lg:w-9 lg:h-9 rounded-full overflow-hidden flex-shrink-0"
          fallbackClassName="bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm"
        />

        <AnimatePresence mode="wait">
          {isSelected ? (
            <m.div
              key="admin-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <select
                value={cooldownMs}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setCooldownMs(Number(e.target.value))}
                className="h-8 rounded-lg border border-yellow-200 bg-white px-2 text-xs font-bold text-yellow-800 outline-none"
                aria-label={t('Cooldown duration')}
              >
                {COOLDOWN_OPTIONS.map((option) => (
                  <option key={option.valueMs} value={option.valueMs}>
                    {option.label}
                  </option>
                ))}
              </select>
              {isOnCooldown ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <m.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdminAction('Cooldown', e);
                      }}
                      className="p-2 bg-emerald-100 hover:bg-emerald-200 rounded-lg text-emerald-700 transition-colors"
                    >
                      <Play size={16} />
                    </m.button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Remove Cooldown')}</TooltipContent>
                </Tooltip>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <m.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAdminAction('Cooldown', e);
                      }}
                      className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-yellow-700 transition-colors"
                    >
                      <Zap size={16} />
                    </m.button>
                  </TooltipTrigger>
                  <TooltipContent>{t('Cooldown User')}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <m.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminAction('Kick', e);
                    }}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
                  >
                    <UserX size={16} />
                  </m.button>
                </TooltipTrigger>
                <TooltipContent>{t('Kick User')}</TooltipContent>
              </Tooltip>
            </m.div>
          ) : (
            <m.div
              key="participant-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">
                {participant.nickname}
              </p>
              <p className="text-xs text-slate-500">
                {formatTimeAgo(participant.joinedAt)}
              </p>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {participant.isPremium && (
          <span style={{ color: '#facc15', fontSize: '16px' }}>★</span>
        )}
        {participant.socketId && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">{t('Online')}</span>
          </div>
        )}
      </div>

      <SettingsDialog
        open={cooldownDialogOpen}
        title={t('Cooldown reason')}
        onClose={() => setCooldownDialogOpen(false)}
      >
        <div className="space-y-3">
          <label
            htmlFor={`cooldown-reason-${id}`}
            className="block text-sm font-bold text-slate-700"
          >
            {t('Reason')}
          </label>
          <textarea
            id={`cooldown-reason-${id}`}
            value={cooldownReason}
            onChange={(e) => setCooldownReason(e.target.value)}
            maxLength={140}
            rows={4}
            className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
          />
          <p className="text-xs font-semibold text-slate-500">
            {t('This reason is shown to the attendee.')}
          </p>
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setCooldownDialogOpen(false)}>
            {t('Cancel')}
          </SettingsDialogButton>
          <SettingsDialogButton onClick={applyCooldown} variant="primary">
            {t('Apply cooldown')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>
    </m.div>
  );
}
