import React, { useState, useEffect } from "react";
import type { PageProps } from "../types";
import { Layout } from "../components/layout/Layout";
import {
  ProfileCard,
  QueueList,
  SearchBar,
  ActionButtons,
  NowPlayingSection,
  ParticipantsList,
  ConnectedUsers,
} from "../components/dashboard";

interface DashboardProps extends PageProps {
  mode: "attendee" | "dj";
}

export function Dashboard({ mode, onNavigate }: DashboardProps) {
  const isDj = mode === "dj";
  const [userName, setUserName] = useState("User");
  const [djName, setDjName] = useState("DJ");
  const [joinedAt, setJoinedAt] = useState(new Date());
  const [accessCode, setAccessCode] = useState("PARTY2024");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    // Fetch user data from auth context or API
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setUserName(userData.displayName || "User");
      } catch {
        // Fallback to default
      }
    }

    // Fetch event data
    const eventData = localStorage.getItem("currentEvent");
    if (eventData) {
      try {
        const parsed = JSON.parse(eventData);
        if (parsed.ownerName) setDjName(parsed.ownerName);
        if (parsed.joinedAt) setJoinedAt(new Date(parsed.joinedAt));
        if (parsed.eventCode) setAccessCode(parsed.eventCode);
      } catch {
        // Fallback to default
      }
    }

    // Listen for dark mode changes from localStorage
    const handleStorageChange = () => {
      const saved = localStorage.getItem('darkMode');
      setIsDarkMode(saved ? JSON.parse(saved) : false);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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
