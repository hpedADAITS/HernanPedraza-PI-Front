import React, { memo } from 'react';
import type { PageProps } from '@/types';
import { Layout } from '@/components/layout/Layout';
import { Logo } from '@/components/common/Logo';
import { DJProfileCard, AttendeeProfileCard, QueueList, SearchBar, ActionButtons, NowPlayingSection, ConnectedUsers } from '@/components/dashboard';
import { useDashboardSession } from '@/hooks/useDashboardSession';
import { useDarkMode } from '@/hooks/useDarkMode';

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
  currentProfilePicture?: string | null;
  eventId: string;
  isDarkMode: boolean;
  isDj: boolean;
  mode: 'attendee' | 'dj';
  onNavigate: PageProps['onNavigate'];
}

const DashboardRightColumn = memo(function DashboardRightColumn({
  djProfilePicture,
  currentProfilePicture,
  eventId,
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
          eventId={eventId}
        />
        <DashboardNowPlayingSection />
        <DashboardConnectedUsers
          mode={mode}
          isDarkMode={isDarkMode}
          ownerProfilePicture={djProfilePicture}
          currentProfilePicture={currentProfilePicture}
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
  const [isDarkMode] = useDarkMode();
  const { dashboardState, handleProfilePictureChange, persistAccessCode } =
    useDashboardSession({
      mode,
      onNavigate,
    });

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
          className="[&>div]:w-[min(56vw,18rem)] lg:[&>div]:w-[min(22vw,12rem)]"
        />
      </div>
      <div className="mx-auto mt-6 flex w-full max-w-[1400px] flex-1 min-h-0 flex-col gap-10 lg:mt-3 lg:flex-row lg:gap-8">
        <DashboardLeftColumn
          accessCode={dashboardState.accessCode}
          djName={dashboardState.djName}
          eventId={dashboardState.eventId}
          isDarkMode={isDarkMode}
          isDj={isDj}
          mode={mode}
          onAccessCodeChange={persistAccessCode}
          onNavigate={onNavigate}
          onProfilePictureChange={handleProfilePictureChange}
          profilePicture={dashboardState.profilePicture}
          userName={dashboardState.userName}
        />

        <DashboardRightColumn
          currentProfilePicture={dashboardState.profilePicture}
          djProfilePicture={dashboardState.djProfilePicture}
          eventId={dashboardState.eventId}
          isDarkMode={isDarkMode}
          isDj={isDj}
          mode={mode}
          onNavigate={onNavigate}
        />
      </div>
    </Layout>
  );
}
