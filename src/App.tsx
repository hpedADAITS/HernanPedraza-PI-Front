import React, { lazy, Suspense } from 'react';
import { LazyMotion, domAnimation } from 'motion/react';
import { Toaster } from 'sonner';
import { useAppStartup } from '@/hooks/useAppStartup';
import { AppRoutes } from '@/router/AppRoutes';
import { useViewNavigation } from '@/router/useViewNavigation';

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

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative w-full h-screen overflow-hidden font-sans text-slate-800">
        <Toaster
          position="top-center"
          toastOptions={{ classNames: { toast: 'z-[1000]' } }}
        />
        <AppRoutes
          direction={direction}
          logoWhite={logoWhite}
          onLogoChange={setLogoWhite}
          onNavigate={navigate}
        />
        {DebugModal ? (
          <Suspense fallback={null}>
            <DebugModal />
          </Suspense>
        ) : null}
      </div>
    </LazyMotion>
  );
}
