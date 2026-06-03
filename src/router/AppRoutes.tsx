import React, { lazy, Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { AppMode, NavigateToView } from '@/types';

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

const APP_MODES = ['attendee', 'dj'] as const;

const WORKSPACE_ROUTES = APP_MODES.flatMap((mode) => [
  { path: `/${mode}/dashboard`, mode, showSongs: false },
  { path: `/${mode}/songs`, mode, showSongs: true },
]);

const SETTINGS_ROUTES = [
  { path: 'settings', Component: SettingsHome },
  { path: 'settings/account', Component: AccountSettings },
  { path: 'settings/app', Component: AppPreferences },
] as const;

function RouteFallback() {
  return (
    <div className="grid h-full w-full place-items-center bg-slate-50 text-sm font-medium text-slate-600">
      Loading...
    </div>
  );
}

function getWorkspaceRoute(pathname: string) {
  return WORKSPACE_ROUTES.find((route) => route.path === pathname) ?? null;
}

export function AppRoutes({
  direction,
  logoWhite,
  onLogoChange,
  onNavigate,
}: AppRoutesProps) {
  const location = useLocation();
  const workspaceRoute = getWorkspaceRoute(location.pathname);

  if (workspaceRoute) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <div className="relative h-full w-full">
          <div
            className="absolute inset-0"
            aria-hidden={workspaceRoute.showSongs}
            inert={workspaceRoute.showSongs ? true : undefined}
          >
            <Dashboard mode={workspaceRoute.mode} onNavigate={onNavigate} />
          </div>

          {workspaceRoute.showSongs && (
            <div className="absolute inset-0 z-50">
              <SongSelection
                mode={workspaceRoute.mode}
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
      <Suspense fallback={<RouteFallback />}>
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
          {APP_MODES.flatMap((mode: AppMode) =>
            SETTINGS_ROUTES.map(({ path, Component }) => (
              <Route
                key={`${mode}-${path}`}
                path={`/${mode}/${path}`}
                element={<Component mode={mode} onNavigate={onNavigate} />}
              />
            )),
          )}
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
