import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';
import { authAPI, clearToken, participantsAPI } from '@/services/api';
import { disconnectSocket, getSocket, leaveEvent } from '@/services/socket';
import { ProfilePictureUpload } from '@/components/common';
import { AttendeePasswordPrompt } from '@/components/dashboard/AttendeeSavePrompt';
import { SettingsChoiceRow, SettingsDialog, SettingsDialogActions, SettingsDialogButton, SettingsList, SettingsListItem, SettingsPageShell, SettingsSearch, SettingsToggleRow } from '@/components/settings/SettingsUI';
import { MEDIA_QUALITY_OPTIONS, useMediaQualityPreference, useProfileSocialPrefs } from '@/features/settings/preferences';
import { readStoredJson, writeStoredJson } from '@/utils/storage';
import { isDebugModeEnabled } from '@/utils/debugMode';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

const SETTINGS_ITEMS = [
  { id: 'profilePicture', label: 'Profile Picture' },
  { id: 'displayName', label: 'Display Name Visibility' },
  { id: 'mediaQuality', label: 'Media Quality' },
  { id: 'socialSettings', label: 'Social Settings' },
  { id: 'debug', label: 'Debug / Diagnostics' },
  { id: 'signOut', label: 'Sign Out' },
] as const;

export function AccountSettings({ mode, onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showMediaQualityModal, setShowMediaQualityModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const { mediaQuality, saveMediaQuality } = useMediaQualityPreference();
  const { saveSocialPrefs, socialPrefs } = useProfileSocialPrefs();
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [showAttendeeSavePrompt, setShowAttendeeSavePrompt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const user = readStoredJson<{ profilePicture?: string | null }>('user');
    if (user) {
      setCurrentProfilePicture(user.profilePicture || null);
    }
  }, []);

  const handleSelectMediaQuality = (value: typeof mediaQuality) => {
    saveMediaQuality(value);
    toast.success(t('Media quality set to {quality}', { quality: t(value) }));
    setShowMediaQualityModal(false);
  };

  const handleToggleSocial = (key: keyof typeof socialPrefs) => {
    const next = { ...socialPrefs, [key]: !socialPrefs[key] };
    saveSocialPrefs(next);
  };

  const handleDisplayName = () => {
    const user = readStoredJson<{ displayName?: string }>('user');
    if (user) {
      setNewDisplayName(user.displayName || '');
    }
    setShowNameModal(true);
  };

  const handleSaveDisplayName = async () => {
    if (!newDisplayName.trim() || newDisplayName.trim().length < 2) {
      toast.error(t('Display name must be at least 2 characters'));
      return;
    }
    setLoading(true);
    try {
      const displayName = newDisplayName.trim();
      await authAPI.updateProfile({ displayName });
      const user = readStoredJson<{ displayName?: string }>('user') || {};
      writeStoredJson('user', {
        ...user,
        displayName,
      });
      const participant = readStoredJson<{ _id?: string; id?: string } & Record<string, unknown>>('currentParticipant');
      const participantId = participant?._id || participant?.id;
      if (participantId) {
        const updatedParticipant = await participantsAPI.updateProfile(participantId, {
          nickname: displayName,
        });
        writeStoredJson('currentParticipant', {
          ...participant,
          ...updatedParticipant,
          nickname: displayName,
        });
      }
      toast.success(t('Display name updated'));
      setShowNameModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('Failed to update display name'),
      );
    } finally {
      setLoading(false);
    }
  };

  const finishAttendeeSignOut = async () => {
    const event = readStoredJson<{ eventId?: string; _id?: string; id?: string }>('currentEvent');
    const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    const eventId = event?.eventId || event?._id || event?.id;
    const participantId = participant?._id || participant?.id;

    if (eventId && participantId) {
      try {
        leaveEvent(eventId, participantId);
      } catch {}
      await participantsAPI.leaveEvent(participantId);
    }

    clearToken();
    disconnectSocket();
    toast.success(t('Signed out'));
    onNavigate('role-selection');
  };

  const finishAttendeeSignOutWithoutSavedProfile = async () => {
    const participant = readStoredJson<{ _id?: string; id?: string }>('currentParticipant');
    const participantId = participant?._id || participant?.id;
    if (participantId) {
      await authAPI.updateProfilePicture({ profilePicture: null });
      await participantsAPI.updateProfile(participantId, { profilePicture: null });
    }

    await finishAttendeeSignOut();
  };

  const handleSignOut = async () => {
    if (mode === 'attendee') {
      setShowAttendeeSavePrompt(true);
      return;
    }

    try {
      await authAPI.logout();
    } catch {
      clearToken();
    }
    disconnectSocket();
    toast.success(t('Signed out'));
    onNavigate('role-selection');
  };

  const getDebugInfo = () => {
    const hasToken = !!localStorage.getItem('authToken');
    const eventData = readStoredJson<{ eventId?: string }>('currentEvent');
    const participantData = readStoredJson<{ _id?: string }>('currentParticipant');
    const eventId = eventData?.eventId || t('None');
    const participantId = participantData?._id || t('None');
    const socketConnected = getSocket()?.connected || false;

    return { hasToken, eventId, participantId, socketConnected };
  };

  const handleItemClick = (item: (typeof SETTINGS_ITEMS)[number]['id']) => {
    switch (item) {
      case 'profilePicture':
        setShowProfilePictureModal(true);
        break;
      case 'displayName':
        handleDisplayName();
        break;
      case 'mediaQuality':
        setShowMediaQualityModal(true);
        break;
      case 'socialSettings':
        setShowSocialModal(true);
        break;
      case 'debug':
        setShowDebugModal(true);
        break;
      case 'signOut':
        handleSignOut();
        break;
    }
  };

  const debugInfo = getDebugInfo();
  const isDebug = isDebugModeEnabled();
  const settingsView = mode === 'dj' ? 'dj-settings' : 'attendee-settings';
  const settingsItems = isDebug
    ? SETTINGS_ITEMS
    : SETTINGS_ITEMS.filter((item) => item.id !== 'debug');
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredSettingsItems = normalizedSearchQuery
    ? settingsItems.filter((item) =>
        t(item.label).toLowerCase().includes(normalizedSearchQuery),
      )
    : settingsItems;

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <SettingsPageShell
        title={t('Account Settings')}
        onBack={() => onNavigate(settingsView)}
        backLabel={t('Cancel')}
      >
        <SettingsSearch value={searchQuery} onChange={setSearchQuery} />

        <SettingsList>
          {filteredSettingsItems.map((item, index) => (
            <SettingsListItem
              key={item.id}
              label={t(item.label)}
              index={index}
              onClick={() => handleItemClick(item.id)}
            />
          ))}
        </SettingsList>

        {filteredSettingsItems.length === 0 && (
          <p className="mt-8 text-center text-base font-medium text-slate-700">
            {t('No settings match your search.')}
          </p>
        )}
      </SettingsPageShell>

      <SettingsDialog
        open={showNameModal}
        title={t('Change Display Name')}
        onClose={() => setShowNameModal(false)}
      >
        <input
          type="text"
          value={newDisplayName}
          onChange={(event) => setNewDisplayName(event.target.value)}
          aria-label={t('New display name')}
          placeholder={t('New display name')}
          className="h-12 w-full rounded-lg border border-slate-200 px-4 text-base text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
        />
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setShowNameModal(false)}>
            {t('Cancel')}
          </SettingsDialogButton>
          <SettingsDialogButton
            onClick={handleSaveDisplayName}
            disabled={loading}
            variant="primary"
          >
            {loading ? t('Saving…') : t('Save')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showDebugModal}
        title={t('Debug Info')}
        onClose={() => setShowDebugModal(false)}
      >
        <div className="space-y-3 text-sm font-mono">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{t('Auth Token')}:</span>
            <span className={debugInfo.hasToken ? 'text-green-600' : 'text-red-500'}>
              {debugInfo.hasToken ? t('Present') : t('Missing')}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{t('Event ID')}:</span>
            <span className="max-w-[180px] truncate text-slate-700">
              {debugInfo.eventId}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{t('Participant ID')}:</span>
            <span className="max-w-[180px] truncate text-slate-700">
              {debugInfo.participantId}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">{t('Socket')}:</span>
            <span
              className={
                debugInfo.socketConnected ? 'text-green-600' : 'text-red-500'
              }
            >
              {debugInfo.socketConnected ? t('Connected') : t('Disconnected')}
            </span>
          </div>
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton
            onClick={() => setShowDebugModal(false)}
            className="w-full flex-none"
          >
            {t('Close')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showMediaQualityModal}
        title={t('Media Quality')}
        onClose={() => setShowMediaQualityModal(false)}
      >
        <div className="flex flex-col gap-2">
          {MEDIA_QUALITY_OPTIONS.map((option) => (
            <SettingsChoiceRow
              key={option.value}
              selected={mediaQuality === option.value}
              onClick={() => handleSelectMediaQuality(option.value)}
            >
              {t(option.label)}
            </SettingsChoiceRow>
          ))}
        </div>
      </SettingsDialog>

      <SettingsDialog
        open={showSocialModal}
        title={t('Social Settings')}
        onClose={() => setShowSocialModal(false)}
      >
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
              onChange={() => handleToggleSocial(key)}
            />
          ))}
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton
            onClick={() => setShowSocialModal(false)}
            className="w-full flex-none"
          >
            {t('Done')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showProfilePictureModal}
        title={t('Profile Picture')}
        onClose={() => setShowProfilePictureModal(false)}
      >
        <div className="mb-6 flex justify-center">
          <ProfilePictureUpload
            currentPicture={currentProfilePicture}
            onPictureUpdated={(newPicture) => {
              setCurrentProfilePicture(newPicture);
              setShowProfilePictureModal(false);
            }}
            size="lg"
          />
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton
            onClick={() => setShowProfilePictureModal(false)}
            className="w-full flex-none"
          >
            {t('Done')}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      {showAttendeeSavePrompt && (
        <AttendeePasswordPrompt
          reason="leave"
          onClose={() => setShowAttendeeSavePrompt(false)}
          onSkip={async () => {
            setShowAttendeeSavePrompt(false);
            try {
              await finishAttendeeSignOutWithoutSavedProfile();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t('Failed to sign out'));
            }
          }}
          onSaved={async () => {
            setShowAttendeeSavePrompt(false);
            try {
              await finishAttendeeSignOut();
            } catch (error) {
              toast.error(error instanceof Error ? error.message : t('Failed to sign out'));
            }
          }}
        />
      )}
    </Layout>
  );
}
