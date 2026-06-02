import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { NavigateToView } from '@/types';

const RoleSelection = lazy(() =>
  import('@/pages/RoleSelection').then((module) => ({
    default: module.RoleSelection,
  })),
);
const loadAttendeeLogin = () =>
  import('@/pages/AttendeeLogin').then((module) => ({
    default: module.AttendeeLogin,
  }));
const loadDJLogin = () =>
  import('@/pages/DJLogin').then((module) => ({ default: module.DJLogin }));
const AttendeeLogin = lazy(loadAttendeeLogin);
const DJLogin = lazy(loadDJLogin);
const DJRegister = lazy(() =>
  import('@/pages/DJRegister').then((module) => ({
    default: module.DJRegister,
  })),
);
const Dashboard = lazy(() =>
  import('@/pages/Dashboard').then((module) => ({ default: module.Dashboard })),
);
const SongSelection = lazy(() =>
  import('@/pages/SongSelection').then((module) => ({
    default: module.SongSelection,
  })),
);
const SettingsHome = lazy(() =>
  import('@/pages/SettingsHome').then((module) => ({
    default: module.SettingsHome,
  })),
);
const AccountSettings = lazy(() =>
  import('@/pages/AccountSettings').then((module) => ({
    default: module.AccountSettings,
  })),
);
const AppPreferences = lazy(() =>
  import('@/pages/AppPreferences').then((module) => ({
    default: module.AppPreferences,
  })),
);
const VerifyEmail = lazy(() =>
  import('@/pages/VerifyEmail').then((module) => ({
    default: module.VerifyEmail,
  })),
);
const Banned = lazy(() =>
  import('@/pages/Banned').then((module) => ({
    default: module.Banned,
  })),
);
const PhoneMicrophone = lazy(() =>
  import('@/pages/PhoneMicrophone').then((module) => ({
    default: module.PhoneMicrophone,
  })),
);

interface AppRoutesProps {
  direction: number;
  logoWhite: boolean;
  onLogoChange: (white: boolean) => void;
  onNavigate: NavigateToView;
}

function getDashboardWorkspaceMode(pathname: string): 'attendee' | 'dj' | null {
  if (pathname === '/attendee/dashboard' || pathname === '/attendee/songs') {
    return 'attendee';
  }

  if (pathname === '/dj/dashboard' || pathname === '/dj/songs') {
    return 'dj';
  }

  return null;
}

export function AppRoutes({
  direction,
  logoWhite,
  onLogoChange,
  onNavigate,
}: AppRoutesProps) {
  const location = useLocation();
  const dashboardWorkspaceMode = getDashboardWorkspaceMode(location.pathname);
  const isSongSelection = location.pathname.endsWith('/songs');

  if (dashboardWorkspaceMode) {
    return (
      <Suspense fallback={null}>
        <div className="relative h-full w-full">
          <div
            className="absolute inset-0"
            aria-hidden={isSongSelection}
            inert={isSongSelection ? true : undefined}
          >
            <Dashboard mode={dashboardWorkspaceMode} onNavigate={onNavigate} />
          </div>

          {isSongSelection && (
            <div className="absolute inset-0 z-50">
              <SongSelection
                mode={dashboardWorkspaceMode}
                onNavigate={onNavigate}
              />
            </div>
          )}
        </div>
      </Suspense>
    );
  }

  return (
    <AnimatePresence mode="wait" custom={direction}>
      <Suspense fallback={null}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/"
            element={
              <RoleSelection
                onNavigate={onNavigate}
                logoWhite={logoWhite}
                onLogoChange={onLogoChange}
                onPrepareLogin={(role) =>
                  role === 'attendee' ? loadAttendeeLogin() : loadDJLogin()
                }
              />
            }
          />
          <Route
            path="/attendee/login"
            element={
              <AttendeeLogin
                onNavigate={onNavigate}
                logoWhite={logoWhite}
                onLogoChange={onLogoChange}
              />
            }
          />
          <Route
            path="/dj/login"
            element={
              <DJLogin
                onNavigate={onNavigate}
                logoWhite={logoWhite}
                onLogoChange={onLogoChange}
              />
            }
          />
          <Route
            path="/dj/register"
            element={
              <DJRegister
                onNavigate={onNavigate}
                logoWhite={logoWhite}
                onLogoChange={onLogoChange}
              />
            }
          />
          <Route
            path="/attendee/dashboard"
            element={<Dashboard mode="attendee" onNavigate={onNavigate} />}
          />
          <Route
            path="/dj/dashboard"
            element={<Dashboard mode="dj" onNavigate={onNavigate} />}
          />
          <Route
            path="/attendee/songs"
            element={<SongSelection mode="attendee" onNavigate={onNavigate} />}
          />
          <Route
            path="/dj/songs"
            element={<SongSelection mode="dj" onNavigate={onNavigate} />}
          />
          <Route
            path="/attendee/settings"
            element={<SettingsHome mode="attendee" onNavigate={onNavigate} />}
          />
          <Route
            path="/attendee/settings/account"
            element={
              <AccountSettings mode="attendee" onNavigate={onNavigate} />
            }
          />
          <Route
            path="/attendee/settings/app"
            element={<AppPreferences mode="attendee" onNavigate={onNavigate} />}
          />
          <Route
            path="/dj/settings"
            element={<SettingsHome mode="dj" onNavigate={onNavigate} />}
          />
          <Route
            path="/dj/settings/account"
            element={<AccountSettings mode="dj" onNavigate={onNavigate} />}
          />
          <Route
            path="/dj/settings/app"
            element={<AppPreferences mode="dj" onNavigate={onNavigate} />}
          />
          <Route
            path="/verify-email"
            element={<VerifyEmail onNavigate={onNavigate} />}
          />
          <Route
            path="/verify-email/:token"
            element={<VerifyEmail onNavigate={onNavigate} />}
          />
          <Route path="/banned" element={<Banned onNavigate={onNavigate} />} />
          <Route path="/dj/microphone/:eventId" element={<PhoneMicrophone />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}
