import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { Lock, X } from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, participantsAPI } from '@/services/api';
import { readStoredJson, writeStoredJson } from '@/utils/storage';
import { t } from '@/i18n';

interface AttendeePasswordPromptProps {
  reason: 'leave' | 'duplicate-login';
  onClose: () => void;
  onSkip: () => void | Promise<void>;
  onSaved: () => void | Promise<void>;
}

const getErrorMessage = (err: unknown, fallback: string) =>
  err instanceof Error && err.message ? err.message : fallback;

const isParticipantPasswordProtected = () => {
  const participant = readStoredJson<{ passwordProtected?: boolean }>('currentParticipant');
  return Boolean(participant?.passwordProtected);
};

export function AttendeePasswordPrompt({
  reason,
  onClose,
  onSkip,
  onSaved,
}: AttendeePasswordPromptProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saveProfilePicture, setSaveProfilePicture] = useState(true);
  const [saving, setSaving] = useState(false);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const passwordProtected = isParticipantPasswordProtected();
  const participant = readStoredJson<{ profilePicture?: string | null }>('currentParticipant');
  const hasProfilePicture = Boolean(participant?.profilePicture);
  const closePrompt = useEffectEvent(onClose);

  const title =
    reason === 'leave' ? t('Save your attendee account?') : t('Someone tried your name');
  const message =
    reason === 'leave'
      ? t('Save it so your nickname and profile picture are available next time.')
      : t('Add a password now so another device cannot take over your attendee name.');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    dialog.showModal();
    return () => {
      dialog.close();
    };
  }, []);

  useEffect(() => {
    if (reason !== 'leave') return undefined;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePrompt();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reason]);

  useEffect(() => {
    passwordInputRef.current?.focus();
  }, []);

  const handleSave = async () => {
    if (!passwordProtected && password.length < 8) {
      toast.error(t('Password must be at least 8 characters'));
      return;
    }
    if (!passwordProtected && password !== confirmPassword) {
      toast.error(t('Passwords do not match'));
      return;
    }

    const storedParticipant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    if (!storedParticipant) {
      toast.error(t('No attendee session found'));
      return;
    }

    setSaving(true);
    try {
      const participantId = storedParticipant._id ?? storedParticipant.id;
      if (!participantId) {
        toast.error(t('No attendee session found'));
        return;
      }

      let updated = passwordProtected
        ? storedParticipant
        : await participantsAPI.setPassword(participantId, password);
      if (hasProfilePicture && !saveProfilePicture) {
        await authAPI.updateProfilePicture({ profilePicture: null });
        updated = await participantsAPI.updateProfile(participantId, {
          profilePicture: null,
        });
      }
      writeStoredJson('currentParticipant', {
        ...storedParticipant,
        ...updated,
        passwordProtected: true,
        profilePicture:
          hasProfilePicture && !saveProfilePicture
            ? null
            : updated.profilePicture ?? participant?.profilePicture ?? null,
      });
      toast.success(t('Attendee account saved'));
      await onSaved();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('Failed to save account')));
    } finally {
      setSaving(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-[9999] m-auto w-full max-w-sm rounded-2xl bg-transparent p-0 backdrop:bg-slate-950/60 backdrop:backdrop-blur-sm"
      aria-labelledby="attendee-password-title"
    >
      <div className="relative rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300"
          aria-label={reason === 'leave' ? t('Cancel logout') : t('Close dialog')}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-3 pr-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Lock size={18} />
          </div>
          <div>
            <h2 id="attendee-password-title" className="text-base font-semibold text-slate-950">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-5 text-slate-600">{message}</p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {!passwordProtected && (
            <>
              <input
                type="password"
                ref={passwordInputRef}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-label={t('Password')}
                placeholder={t('Password')}
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-emerald-200"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-label={t('Confirm password')}
                placeholder={t('Confirm password')}
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm text-slate-950 outline-none focus:border-slate-900 focus:ring-2 focus:ring-emerald-200"
              />
            </>
          )}
          {hasProfilePicture && reason === 'leave' && (
            <label className="flex items-center gap-3 rounded-lg border border-slate-200 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={saveProfilePicture}
                onChange={(e) => setSaveProfilePicture(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              {t('Save my profile picture for next time')}
            </label>
          )}
        </div>

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={reason === 'leave' ? onSkip : onClose}
            className="h-10 rounded-lg px-4 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            {reason === 'leave' ? t('Leave without saving') : t('Not now')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="h-10 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? t('Saving...') : passwordProtected ? t('Save and log out') : t('Set password and log out')}
          </button>
        </div>
      </div>
    </dialog>
  );
}
