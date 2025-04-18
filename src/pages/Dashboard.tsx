import React, {
  memo,
  useCallback,
  useState,
  useEffect,
  useEffectEvent,
} from 'react';
import type { PageProps } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Logo } from '@/components/common/Logo';
import {
  DJProfileCard,
  AttendeeProfileCard,
  QueueList,
  SearchBar,
  ActionButtons,
  NowPlayingSection,
  ConnectedUsers,
} from '@/components/dashboard';
import {
  initSocket,
  joinEvent,
  onAccessCodeUpdated,
  onSongSuggested,
  onEventEnded,
  off,
  disconnectSocket,
} from '@/services/socket';
import { clearToken, eventsAPI } from '@/services/api';
import { useDarkMode } from '@/hooks/useDarkMode';
import { toast } from 'sonner';
import {
  readStoredJson,
  writeStoredJson,
  removeStoredItem,
} from '@/utils/storage';

interface DashboardProps extends PageProps {
  mode: 'attendee' | 'dj';
}

const DashboardLogo = memo(Logo);
const DashboardQueueList = memo(QueueList);
const DashboardSearchBar = memo(SearchBar);
const DashboardActionButtons = memo(ActionButtons);
const DashboardNowPlayingSection = memo(NowPlayingSection);
const DashboardConnectedUsers = memo(ConnectedUsers);

interface DashboardLeftColumnProps {
  accessCode: string;
  djName: string;
  eventId: string;
  isDarkMode: boolean;
  isDj: boolean;
  mode: 'attendee' | 'dj';
  onAccessCodeChange: (newCode: string) => void;
  onNavigate: PageProps['onNavigate'];
  onProfilePictureChange: (newPicture: string) => void;
  profilePicture?: string | null;
  userName: string;
}

const DashboardLeftColumn = memo(function DashboardLeftColumn({
  accessCode,
  djName,
  eventId,
  isDarkMode,
  isDj,
  mode,
  onAccessCodeChange,
  onNavigate,
  onProfilePictureChange,
  profilePicture,
  userName,
}: DashboardLeftColumnProps) {
  return (
    <div className="w-full lg:w-[36%] min-h-0 flex flex-col gap-8 lg:gap-6">
      {isDj ? (
        <DJProfileCard
          userName={userName}
          profilePicture={profilePicture}
          accessCode={accessCode}
          eventId={eventId}
          onAccessCodeChange={onAccessCodeChange}
          onProfilePictureChange={onProfilePictureChange}
        />
      ) : (
        <AttendeeProfileCard
          userName={userName}
          djName={djName}
          profilePicture={profilePicture}
          onProfilePictureChange={onProfilePictureChange}
        />
      )}
      <DashboardActionButtons
        mode={mode}
        onNavigate={onNavigate}
        showVoting={false}
      />
      <DashboardQueueList mode={mode} isDarkMode={isDarkMode} />
    </div>
  );
});

interface DashboardRightColumnProps {
  djProfilePicture?: string | null;
  isDarkMode: boolean;
  isDj: boolean;
  mode: 'attendee' | 'dj';
  onNavigate: PageProps['onNavigate'];
}

const DashboardRightColumn = memo(function DashboardRightColumn({
  djProfilePicture,
  isDarkMode,
  isDj,
  mode,
  onNavigate,
}: DashboardRightColumnProps) {
  return (
    <div className="w-full lg:w-[64%] min-h-0 relative">
      <div className="mx-auto flex w-full max-w-[896px] flex-col gap-8 lg:gap-6">
        <DashboardSearchBar
          onNavigate={onNavigate}
          isDj={isDj}
          isDarkMode={isDarkMode}
        />
        <DashboardNowPlayingSection />
        <DashboardConnectedUsers
          mode={mode}
          isDarkMode={isDarkMode}
          ownerProfilePicture={djProfilePicture}
        />
        {!isDj && (
          <DashboardActionButtons
            mode={mode}
            onNavigate={onNavigate}
            showActions={false}
          />
        )}
      </div>
    </div>
  );
});

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const isDj = mode === 'dj';
  const [userName, setUserName] = useState('User');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [djName, setDjName] = useState('DJ');
  const [djProfilePicture, setDjProfilePicture] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [eventId, setEventId] = useState('');
  const [isDarkMode] = useDarkMode();
  const navigateAway = useEffectEvent(() => {
    onNavigate(isDj ? 'dj-login' : 'attendee-login');
  });

  const persistAccessCode = useCallback((newCode: string) => {
    setAccessCode((currentCode) =>
      currentCode === newCode ? currentCode : newCode,
    );
    const eventData = readStoredJson<
      { accessCode?: string } & Record<string, unknown>
    >('currentEvent');
    if (eventData) {
      writeStoredJson('currentEvent', {
        ...eventData,
        accessCode: newCode,
      });
    }
  }, []);

  useEffect(() => {
    const eventData = readStoredJson<{
      eventId?: string;
      ownerName?: string;
      accessCode?: string;
      ownerProfilePicture?: string | null;
    }>('currentEvent');
    const participantData = readStoredJson<{
      _id?: string;
      nickname?: string;
      profilePicture?: string | null;
    }>('currentParticipant');

    if (!eventData || !participantData) {
      navigateAway();
      return;
    }

    const token = localStorage.getItem('authToken');
    const socket = initSocket(token ?? undefined);

    const user = readStoredJson<{
      displayName?: string;
      profilePicture?: string | null;
    }>('user');
    if (user) {
      setUserName(user.displayName || 'User');
      setProfilePicture(user.profilePicture || null);
    }

    if (participantData?.profilePicture) {
      setProfilePicture(participantData.profilePicture);
    }

    const handleConnect = async () => {
      try {
        if (!eventData.eventId || !participantData._id) {
          throw new Error('Session data is incomplete');
        }
        if (eventData.ownerName) setDjName(eventData.ownerName);
        if (eventData.ownerProfilePicture) {
          setDjProfilePicture(eventData.ownerProfilePicture);
        }
        setEventId(eventData.eventId);

        // Fetch fresh event data from backend to get current accessCode
        const freshEvent = await eventsAPI.getEvent(eventData.eventId);
        if (freshEvent?.accessCode) {
          // Update localStorage with fresh accessCode
          persistAccessCode(freshEvent.accessCode);
        }
        if (freshEvent?.ownerId?.profilePicture) {
          setDjProfilePicture(freshEvent.ownerId.profilePicture);
          writeStoredJson('currentEvent', {
            ...eventData,
            accessCode: freshEvent.accessCode || eventData.accessCode,
            ownerProfilePicture: freshEvent.ownerId.profilePicture,
          });
        }

        joinEvent(
          eventData.eventId,
          participantData._id,
          participantData.nickname || 'User',
          participantData.profilePicture || user?.profilePicture || null,
        );
      } catch (error) {
        console.error('Error initializing dashboard:', error);
        // Fallback to localStorage if backend fetch fails
        try {
          if (eventData.accessCode) {
            persistAccessCode(eventData.accessCode);
          }
        } catch {}
      }
    };

    const handleAccessCodeUpdated = (data: { accessCode: string }) => {
      if (!data?.accessCode) return;
      persistAccessCode(data.accessCode);
      toast.info(`Access code changed to ${data.accessCode}`);
    };

    const handleSongSuggested = (data: {
      participantId?: string;
      nickname?: string;
      title?: string;
    }) => {
      if (!data?.title) return;
      try {
        const localId = JSON.parse(participantData)._id;
        if (data.participantId === localId) return;
      } catch {}
      toast.info(`${data.nickname || 'Someone'} suggested ${data.title}!`);
    };

    const handleEventEnded = (data: {
      cancelled?: boolean;
      reason?: string;
    }) => {
      if (isDj) return;
      const msg = data?.cancelled
        ? `Event cancelled${data.reason ? `: ${data.reason}` : ''}`
        : 'The DJ ended the event';
      toast.info(msg);
      clearToken();
      disconnectSocket();
      removeStoredItem('currentEvent');
      removeStoredItem('currentParticipant');
      removeStoredItem('user');
      onNavigate('attendee-login');
    };

    onAccessCodeUpdated(handleAccessCodeUpdated);
    onSongSuggested(handleSongSuggested);
    onEventEnded(handleEventEnded);

    if (socket?.connected) {
      handleConnect();
    } else {
      socket?.once('connect', handleConnect);
    }

    return () => {
      off('access_code_updated', handleAccessCodeUpdated);
      off('song_suggested', handleSongSuggested);
      off('event_ended', handleEventEnded);
    };
  }, [isDj, persistAccessCode]);

  return (
    <Layout
      theme="white"
      className="min-h-0 p-6 md:p-10 lg:px-8 lg:py-0 lg:pb-2"
      showNav={true}
    >
      <div className="mx-auto mt-4 flex w-full max-w-[1400px] justify-center lg:mt-0">
        <DashboardLogo
          useWhite={isDarkMode}
          size="large"
          className="[&>div]:w-[min(72vw,26rem)] lg:[&>div]:w-[min(42vw,16rem)]"
        />
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-[1400px] flex-1 min-h-0 flex-col gap-10 lg:mt-3 lg:flex-row lg:gap-8">
        <DashboardLeftColumn
          accessCode={accessCode}
          djName={djName}
          eventId={eventId}
          isDarkMode={isDarkMode}
          isDj={isDj}
          mode={mode}
          onAccessCodeChange={persistAccessCode}
          onNavigate={onNavigate}
          onProfilePictureChange={setProfilePicture}
          profilePicture={profilePicture}
          userName={userName}
        />

        <DashboardRightColumn
          djProfilePicture={djProfilePicture}
          isDarkMode={isDarkMode}
          isDj={isDj}
          mode={mode}
          onNavigate={onNavigate}
        />
      </div>
    </Layout>
  );
}
