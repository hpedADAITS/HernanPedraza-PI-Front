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
import { initSocket, joinEvent } from '@/services/socket';
import { useDarkMode } from '@/hooks/useDarkMode';

interface DashboardProps extends PageProps {
  mode: 'attendee' | 'dj';
}

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const isDj = mode === 'dj';
  const [userName, setUserName] = useState('User');
  const [djName, setDjName] = useState('DJ');
  const [joinedAt, setJoinedAt] = useState(new Date());
  const [accessCode, setAccessCode] = useState('');
  const [isDarkMode] = useDarkMode();

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

        joinEvent(
          eventParsed.eventId,
          participantParsed._id,
          participantParsed.nickname || 'User',
        );
      } catch (error) {
        console.error('Error initializing dashboard:', error);
      }
    };

    if (socket?.connected) {
      handleConnect();
    } else {
      socket?.once('connect', handleConnect);
    }
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
