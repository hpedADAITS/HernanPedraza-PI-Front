import React, { lazy, Suspense, useEffect } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { ToastContainer } from '@/components/ui/toast';
import { useAppStartup } from '@/hooks/useAppStartup';
import { AppRoutes } from '@/router/AppRoutes';
import { ViewNavigationProvider } from '@/router/navigationContext';
import { useViewNavigation } from '@/router/useViewNavigation';
import { soundEffects } from '@/utils/soundEffects';

const DebugModal =
  import.meta.env.DEV
    ? lazy(() =>
        import('@/components/debug/SongCardDebugModal').then((module) => ({
          default: module.SongCardDebugModal,
        })),
      )
    : null;

export default function App() {
  useAppStartup();
  const { direction, logoWhite, navigate, setLogoWhite } = useViewNavigation();

  useEffect(() => {
    soundEffects.preloadAll();
  }, []);

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-full h-screen overflow-hidden font-sans text-slate-800">
        <ToastContainer position="top-center" />
        <ViewNavigationProvider navigate={navigate}>
          <AppRoutes
            direction={direction}
            logoWhite={logoWhite}
            onLogoChange={setLogoWhite}
            onNavigate={navigate}
          />
        </ViewNavigationProvider>
        {DebugModal ? (
          <Suspense fallback={null}>
            <DebugModal />
          </Suspense>
        ) : null}
      </div>
    </LazyMotion>
  );
}
