import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { useToast } from '@/hooks/useToast';
import { authAPI, clearToken, participantsAPI } from '@/services/api';
import { disconnectSocket, leaveEvent } from '@/services/socket';
import { AttendeePasswordPrompt } from '@/components/dashboard/AttendeeSavePrompt';
import { SettingsList, SettingsListItem, SettingsPageShell, SettingsSearch } from '@/components/settings/SettingsUI';
import { DisplayNameModal } from '@/components/modals/DisplayNameModal';
import { DebugInfoModal } from '@/components/modals/DebugInfoModal';
import { MediaQualityModal } from '@/components/modals/MediaQualityModal';
import { SocialSettingsModal } from '@/components/modals/SocialSettingsModal';
import { ProfilePictureModal } from '@/components/modals/ProfilePictureModal';
import { readStoredJson } from '@/utils/storage';
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
  { id: 'friends', label: 'Friends' },
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
  const [showAttendeeSavePrompt, setShowAttendeeSavePrompt] = useState(false);
  const { toast } = useToast();

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

  const handleItemClick = (item: (typeof SETTINGS_ITEMS)[number]['id']) => {
    switch (item) {
      case 'profilePicture':
        setShowProfilePictureModal(true);
        break;
      case 'displayName':
        setShowNameModal(true);
        break;
      case 'mediaQuality':
        setShowMediaQualityModal(true);
        break;
      case 'socialSettings':
        setShowSocialModal(true);
        break;
      case 'friends':
        onNavigate(mode === 'dj' ? 'dj-friends' : 'attendee-friends');
        break;
      case 'debug':
        setShowDebugModal(true);
        break;
      case 'signOut':
        handleSignOut();
        break;
    }
  };

  const isDebug = isDebugModeEnabled();
  const settingsView = mode === 'dj' ? 'dj-settings' : 'attendee-settings';
  const settingsItems = isDebug
    ? SETTINGS_ITEMS
    : SETTINGS_ITEMS.filter((item) => item.id !== 'debug');
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredSettingsItems = normalizedSearchQuery
    ? settingsItems.filter((item) => t(item.label).toLowerCase().includes(normalizedSearchQuery))
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

      <DisplayNameModal open={showNameModal} onClose={() => setShowNameModal(false)} />
      <DebugInfoModal open={showDebugModal} onClose={() => setShowDebugModal(false)} />
      <MediaQualityModal open={showMediaQualityModal} onClose={() => setShowMediaQualityModal(false)} />
      <SocialSettingsModal open={showSocialModal} onClose={() => setShowSocialModal(false)} />
      <ProfilePictureModal open={showProfilePictureModal} onClose={() => setShowProfilePictureModal(false)} />

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
