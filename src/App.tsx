import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { AttendeeLogin } from '@/pages/AttendeeLogin';
import { DjLogin } from '@/pages/DjLogin';
import { Dashboard } from '@/pages/Dashboard';
import { SongSelection } from '@/pages/SongSelection';
import { Settings } from '@/pages/Settings';
import { SettingsList } from '@/pages/SettingsList';
import { RoleSelection } from '@/pages/RoleSelection';
import { checkHealth, loadToken } from '@/services/api';
import { API_BASE } from '@/services/api';
import type { View } from '@/types';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('role-selection');
  const [direction, setDirection] = useState(1);
  const [logoWhite, setLogoWhite] = useState(false);

  useEffect(() => {
    // Load token from localStorage on app startup
    loadToken();
    
    const checkDatabaseConnection = async () => {
      const health = await checkHealth();
      if (health.database) {
        toast.success(`Connected to ${API_BASE}`);
      } else {
        toast.error(`Failed to connect to ${API_BASE}`);
      }
    };
    checkDatabaseConnection();
  }, []);

  const navigate = (view: View) => {
    // Simple logic to determine animation direction
    if (view === 'role-selection') {
      setDirection(-1);
      setLogoWhite(false);
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
      <Toaster position="top-center" toastOptions={{ classNames: { toast: 'z-[1000]' } }} />
      <AnimatePresence mode="wait" custom={direction}>
        {currentView === 'role-selection' && (
          <RoleSelection key="role-selection" onNavigate={navigate} logoWhite={logoWhite} onLogoChange={setLogoWhite} />
        )}
        {currentView === 'attendee-login' && (
          <AttendeeLogin key="attendee-login" onNavigate={navigate} logoWhite={logoWhite} onLogoChange={setLogoWhite} />
        )}
        {currentView === 'dj-login' && (
          <DjLogin key="dj-login" onNavigate={navigate} logoWhite={logoWhite} onLogoChange={setLogoWhite} />
        )}
        {(currentView === 'attendee-dashboard' || currentView === 'dj-dashboard') && (
          <Dashboard 
            key={currentView} 
            mode={currentView === 'attendee-dashboard' ? 'attendee' : 'dj'} 
            onNavigate={navigate} 
          />
        )}
        {(currentView === 'attendee-song-select' || currentView === 'dj-song-select') && (
          <SongSelection 
            key={currentView}
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
