import React from 'react';
import { Toaster } from 'sonner';
import { useAppStartup } from '@/hooks/useAppStartup';
import { SongCardDebugModal } from '@/components/debug/SongCardDebugModal';
import { AppRoutes } from '@/router/AppRoutes';
import { useViewNavigation } from '@/router/useViewNavigation';

export default function App() {
  useAppStartup();
  const { direction, logoWhite, navigate, setLogoWhite } = useViewNavigation();

  return (
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
      <SongCardDebugModal />
    </div>
  );
}
