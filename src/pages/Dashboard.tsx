import React, { useState, useEffect } from 'react';
import type { PageProps } from '@/types';
import { Layout } from '@/components/layout/Layout';
import {
  ProfileCard,
  QueueList,
  SearchBar,
  ActionButtons,
  NowPlayingSection,
  ParticipantsList,
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
import { clearToken } from '@/services/api';
import { useDarkMode } from '@/hooks/useDarkMode';
import { toast } from 'sonner';

interface DashboardProps extends PageProps {
  mode: 'attendee' | 'dj';
}

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const isDj = mode === 'dj';
  const [userName, setUserName] = useState('User');
  const [djName, setDjName] = useState('DJ');
  const [joinedAt, setJoinedAt] = useState(new Date());
  const [accessCode, setAccessCode] = useState('');
  const [eventId, setEventId] = useState('');
  const [isDarkMode] = useDarkMode();

  const persistAccessCode = (newCode: string) => {
    setAccessCode(newCode);
    const eventData = localStorage.getItem('currentEvent');
    if (eventData) {
      try {
        const parsed = JSON.parse(eventData);
        parsed.accessCode = newCode;
        parsed.eventCode = newCode;
        localStorage.setItem('currentEvent', JSON.stringify(parsed));
      } catch {}
    }
  };

  useEffect(() => {
    const eventData = localStorage.getItem('currentEvent');
    const participantData = localStorage.getItem('currentParticipant');

    if (!eventData || !participantData) {
      onNavigate(isDj ? 'dj-login' : 'attendee-login');
      return;
    }

    const token = localStorage.getItem('authToken');
    const socket = initSocket(token ?? undefined);

    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(userData.displayName || 'User');
      } catch {}
    }

    const handleConnect = () => {
      try {
        const eventParsed = JSON.parse(eventData);
        const participantParsed = JSON.parse(participantData);

        if (eventParsed.ownerName) setDjName(eventParsed.ownerName);
        if (eventParsed.joinedAt) setJoinedAt(new Date(eventParsed.joinedAt));
        if (eventParsed.eventCode || eventParsed.accessCode) {
          setAccessCode(eventParsed.eventCode || eventParsed.accessCode);
        }
        if (eventParsed.eventId) setEventId(eventParsed.eventId);

        joinEvent(
          eventParsed.eventId,
          participantParsed._id,
          participantParsed.nickname || 'User',
        );
      } catch (error) {
        console.error('Error initializing dashboard:', error);
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

    const handleEventEnded = (data: { cancelled?: boolean; reason?: string }) => {
      if (isDj) return;
      const msg = data?.cancelled
        ? `Event cancelled${data.reason ? `: ${data.reason}` : ''}`
        : 'The DJ ended the event';
      toast.info(msg);
      clearToken();
      disconnectSocket();
      localStorage.removeItem('currentEvent');
      localStorage.removeItem('currentParticipant');
      localStorage.removeItem('user');
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
  }, [isDj]);

  return (
    <Layout theme="white" className="p-6 md:p-12" showNav={true}>
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col lg:flex-row gap-8 mt-12">
        {/* Left Column: Profile & Queue */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <ProfileCard
            mode={mode}
            userName={userName}
            djName={djName}
            joinedAt={joinedAt}
            accessCode={accessCode}
            eventId={eventId}
            onAccessCodeChange={persistAccessCode}
          />
          <QueueList mode={mode} isDarkMode={isDarkMode} />
        </div>

        {/* Right Column: Search, Now Playing, Participants, Connected Users & Actions */}
        <div className="w-full lg:w-2/3 flex flex-col justify-between gap-6 relative">
          <SearchBar onNavigate={onNavigate} isDj={isDj} />
          <NowPlayingSection />
          {isDj && <ParticipantsList mode={mode} />}
          {!isDj && <ConnectedUsers mode={mode} isDarkMode={isDarkMode} />}
          <ActionButtons mode={mode} onNavigate={onNavigate} />
        </div>
      </div>
    </Layout>
  );
}
