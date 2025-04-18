import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { toast } from 'sonner';
import { authAPI, clearToken } from '@/services/api';
import { disconnectSocket, getSocket } from '@/services/socket';
import { ProfilePictureUpload } from '@/components/common';
import {
  SettingsChoiceRow,
  SettingsDialog,
  SettingsDialogActions,
  SettingsDialogButton,
  SettingsList,
  SettingsListItem,
  SettingsPageShell,
  SettingsSearch,
  SettingsToggleRow,
} from '@/components/settings/SettingsUI';
import {
  readStoredJson,
  writeStoredJson,
} from '@/utils/storage';
import type { NavigateToView } from '@/types';

interface Props {
  mode: 'attendee' | 'dj';
  onNavigate: NavigateToView;
}

type MediaQuality = 'low' | 'medium' | 'high' | 'auto';

interface SocialPrefs {
  showDisplayName: boolean;
  showProfilePicture: boolean;
  allowFriendRequests: boolean;
}

const MEDIA_QUALITY_OPTIONS: { value: MediaQuality; label: string }[] = [
  { value: 'auto', label: 'Auto (recommended)' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low (data saver)' },
];

const DEFAULT_SOCIAL_PREFS: SocialPrefs = {
  showDisplayName: true,
  showProfilePicture: true,
  allowFriendRequests: true,
};

const SETTINGS_ITEMS = [
  'Profile Picture',
  'Display Name Visibility',
  'Media Quality',
  'Social Settings',
  'Debug / Diagnostics',
  'Sign Out',
];

export function AccountSettings({ mode, onNavigate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNameModal, setShowNameModal] = useState(false);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [showMediaQualityModal, setShowMediaQualityModal] = useState(false);
  const [showSocialModal, setShowSocialModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [mediaQuality, setMediaQuality] = useState<MediaQuality>('auto');
  const [socialPrefs, setSocialPrefs] =
    useState<SocialPrefs>(DEFAULT_SOCIAL_PREFS);
  const [currentProfilePicture, setCurrentProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const storedQuality = localStorage.getItem(
      'mediaQuality',
    ) as MediaQuality | null;
    if (
      storedQuality &&
      MEDIA_QUALITY_OPTIONS.some((o) => o.value === storedQuality)
    ) {
      setMediaQuality(storedQuality);
    }
    const storedSocial = localStorage.getItem('socialPrefs');
    if (storedSocial) {
      try {
        setSocialPrefs({ ...DEFAULT_SOCIAL_PREFS, ...JSON.parse(storedSocial) });
      } catch {}
    }
    const user = readStoredJson<{ profilePicture?: string | null }>('user');
    if (user) {
      setCurrentProfilePicture(user.profilePicture || null);
    }
  }, []);

  const handleSelectMediaQuality = (value: MediaQuality) => {
    setMediaQuality(value);
    localStorage.setItem('mediaQuality', value);
    toast.success(`Media quality set to ${value}`);
    setShowMediaQualityModal(false);
  };

  const handleToggleSocial = (key: keyof SocialPrefs) => {
    const next = { ...socialPrefs, [key]: !socialPrefs[key] };
    setSocialPrefs(next);
    localStorage.setItem('socialPrefs', JSON.stringify(next));
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
      toast.error('Display name must be at least 2 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.updateProfile({ displayName: newDisplayName.trim() });
      const user = readStoredJson<{ displayName?: string }>('user') || {};
      writeStoredJson('user', {
        ...user,
        displayName: newDisplayName.trim(),
      });
      toast.success('Display name updated');
      setShowNameModal(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to update display name',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authAPI.logout();
    } catch {
      clearToken();
    }
    disconnectSocket();
    toast.success('Signed out');
    onNavigate('role-selection');
  };

  const getDebugInfo = () => {
    const hasToken = !!localStorage.getItem('authToken');
    const eventData = readStoredJson<{ eventId?: string }>('currentEvent');
    const participantData = readStoredJson<{ _id?: string }>('currentParticipant');
    const eventId = eventData?.eventId || 'None';
    const participantId = participantData?._id || 'None';
    const socketConnected = getSocket()?.connected || false;

    return { hasToken, eventId, participantId, socketConnected };
  };

  const handleItemClick = (item: string) => {
    switch (item) {
      case 'Profile Picture':
        setShowProfilePictureModal(true);
        break;
      case 'Display Name Visibility':
        handleDisplayName();
        break;
      case 'Media Quality':
        setShowMediaQualityModal(true);
        break;
      case 'Social Settings':
        setShowSocialModal(true);
        break;
      case 'Debug / Diagnostics':
        setShowDebugModal(true);
        break;
      case 'Sign Out':
        handleSignOut();
        break;
    }
  };

  const debugInfo = getDebugInfo();
  const settingsView = mode === 'dj' ? 'dj-settings' : 'attendee-settings';
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredSettingsItems = normalizedSearchQuery
    ? SETTINGS_ITEMS.filter((item) =>
        item.toLowerCase().includes(normalizedSearchQuery),
      )
    : SETTINGS_ITEMS;

  return (
    <Layout theme="blue" className="p-6 md:p-12 items-center" showNav={true}>
      <SettingsPageShell
        title="Account Settings"
        onBack={() => onNavigate(settingsView)}
        backLabel="Cancel"
      >
        <SettingsSearch value={searchQuery} onChange={setSearchQuery} />

        <SettingsList>
          {filteredSettingsItems.map((item, index) => (
            <SettingsListItem
              key={item}
              label={item}
              index={index}
              onClick={() => handleItemClick(item)}
            />
          ))}
        </SettingsList>

        {filteredSettingsItems.length === 0 && (
          <p className="mt-8 text-center text-base font-medium text-slate-700">
            No settings match your search.
          </p>
        )}
      </SettingsPageShell>

      <SettingsDialog
        open={showNameModal}
        title="Change Display Name"
        onClose={() => setShowNameModal(false)}
      >
        <input
          type="text"
          value={newDisplayName}
          onChange={(event) => setNewDisplayName(event.target.value)}
          placeholder="New display name"
          className="h-12 w-full rounded-lg border border-slate-200 px-4 text-base text-slate-700 outline-none focus:ring-4 focus:ring-blue-100"
        />
        <SettingsDialogActions>
          <SettingsDialogButton onClick={() => setShowNameModal(false)}>
            Cancel
          </SettingsDialogButton>
          <SettingsDialogButton
            onClick={handleSaveDisplayName}
            disabled={loading}
            variant="primary"
          >
            {loading ? 'Saving…' : 'Save'}
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showDebugModal}
        title="Debug Info"
        onClose={() => setShowDebugModal(false)}
      >
        <div className="space-y-3 text-sm font-mono">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Auth Token:</span>
            <span className={debugInfo.hasToken ? 'text-green-600' : 'text-red-500'}>
              {debugInfo.hasToken ? 'Present' : 'Missing'}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Event ID:</span>
            <span className="max-w-[180px] truncate text-slate-700">
              {debugInfo.eventId}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Participant ID:</span>
            <span className="max-w-[180px] truncate text-slate-700">
              {debugInfo.participantId}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Socket:</span>
            <span
              className={
                debugInfo.socketConnected ? 'text-green-600' : 'text-red-500'
              }
            >
              {debugInfo.socketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <SettingsDialogActions>
          <SettingsDialogButton
            onClick={() => setShowDebugModal(false)}
            className="w-full flex-none"
          >
            Close
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showMediaQualityModal}
        title="Media Quality"
        onClose={() => setShowMediaQualityModal(false)}
      >
        <div className="flex flex-col gap-2">
          {MEDIA_QUALITY_OPTIONS.map((option) => (
            <SettingsChoiceRow
              key={option.value}
              selected={mediaQuality === option.value}
              onClick={() => handleSelectMediaQuality(option.value)}
            >
              {option.label}
            </SettingsChoiceRow>
          ))}
        </div>
      </SettingsDialog>

      <SettingsDialog
        open={showSocialModal}
        title="Social Settings"
        onClose={() => setShowSocialModal(false)}
      >
        <div className="flex flex-col gap-3">
          {(
            [
              ['showDisplayName', 'Show display name'],
              ['showProfilePicture', 'Show profile picture'],
              ['allowFriendRequests', 'Allow friend requests'],
            ] as [keyof SocialPrefs, string][]
          ).map(([key, label]) => (
            <SettingsToggleRow
              key={key}
              label={label}
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
            Done
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>

      <SettingsDialog
        open={showProfilePictureModal}
        title="Profile Picture"
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
            Done
          </SettingsDialogButton>
        </SettingsDialogActions>
      </SettingsDialog>
    </Layout>
  );
}
