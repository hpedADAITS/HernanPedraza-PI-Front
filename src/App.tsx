import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AttendeeLogin } from './components/views/AttendeeLogin';
import { DjLogin } from './components/views/DjLogin';
import { Dashboard } from './components/views/Dashboard';
import { SongSelection } from './components/views/SongSelection';
import { Settings } from './components/views/Settings';
import { SettingsList } from './components/views/SettingsList';
import { RoleSelection } from './components/views/RoleSelection';
import { Toaster } from 'sonner@2.0.3';

export type View = 
  | 'role-selection'
  | 'attendee-login' 
  | 'dj-login' 
  | 'attendee-dashboard' 
  | 'dj-dashboard' 
  | 'attendee-song-select' 
  | 'dj-song-select' 
  | 'dj-settings'
  | 'dj-account-settings';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('role-selection');
  const [direction, setDirection] = useState(1);

  const navigate = (view: View) => {
    // Simple logic to determine animation direction
    if (view === 'role-selection') {
      setDirection(-1);
    } else if (currentView === 'role-selection') {
      setDirection(1);
    } else if (view.includes('login') && !currentView.includes('login')) {
      setDirection(-1);
    } else {
      setDirection(1);
    }
    setCurrentView(view);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden font-sans text-slate-800">
      <Toaster position="top-center" />
      <AnimatePresence mode="wait" custom={direction}>
        {currentView === 'role-selection' && (
          <RoleSelection key="role-selection" onNavigate={navigate} />
        )}
        {currentView === 'attendee-login' && (
          <AttendeeLogin key="attendee-login" onNavigate={navigate} />
        )}
        {currentView === 'dj-login' && (
          <DjLogin key="dj-login" onNavigate={navigate} />
        )}
        {(currentView === 'attendee-dashboard' || currentView === 'dj-dashboard') && (
          <Dashboard 
            key="dashboard" 
            mode={currentView === 'attendee-dashboard' ? 'attendee' : 'dj'} 
            onNavigate={navigate} 
          />
        )}
        {(currentView === 'attendee-song-select' || currentView === 'dj-song-select') && (
          <SongSelection 
            key="song-select"
            mode={currentView === 'attendee-song-select' ? 'attendee' : 'dj'}
            onNavigate={navigate}
          />
        )}
        {currentView === 'dj-settings' && (
          <Settings key="dj-settings" onNavigate={navigate} />
        )}
        {currentView === 'dj-account-settings' && (
          <SettingsList key="dj-account-settings" onNavigate={navigate} />
        )}
      </AnimatePresence>
    </div>
  );
}
