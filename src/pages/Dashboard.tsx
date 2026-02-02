import React from 'react';
import type { PageProps } from '../types';
import { Layout } from '../components/layout/Layout';
import {
  ProfileCard,
  QueueList,
  SearchBar,
  ActionButtons,
  NowPlayingSection
} from '../components/dashboard';

interface DashboardProps extends PageProps {
  mode: 'attendee' | 'dj';
}

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const isDj = mode === 'dj';

  return (
    <Layout theme="white" className="p-6 md:p-12" showNav={true}>
      <div className="max-w-7xl mx-auto w-full h-full flex flex-col lg:flex-row gap-8 mt-12">
        
        {/* Left Column: Profile & Queue */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <ProfileCard mode={mode} />
          <QueueList mode={mode} />
        </div>

        {/* Right Column: Search & Actions */}
        <div className="w-full lg:w-2/3 flex flex-col justify-between gap-6 relative">
          <SearchBar onNavigate={onNavigate} isDj={isDj} />
          <NowPlayingSection />
          <ActionButtons mode={mode} onNavigate={onNavigate} />
        </div>
      </div>
    </Layout>
  );
}
