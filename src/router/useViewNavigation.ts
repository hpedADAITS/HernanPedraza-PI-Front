import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getViewFromPath, getViewPath } from '@/router/routePaths';
import type { NavigateToView, View } from '@/types';

export function useViewNavigation() {
  const location = useLocation();
  const routerNavigate = useNavigate();
  const [direction, setDirection] = useState(1);
  const [currentView, setCurrentView] = useState<View>('role-selection');
  const [logoWhite, setLogoWhite] = useState(false);

  useEffect(() => {
    const nextView = getViewFromPath(location.pathname);
    setCurrentView(nextView);
    if (nextView === 'role-selection') {
      setLogoWhite(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const verifyEmailToken = searchParams.get('verifyEmailToken');
    if (verifyEmailToken && !location.pathname.startsWith('/verify-email')) {
      setCurrentView('verify-email');
      routerNavigate(
        `/verify-email?verifyEmailToken=${encodeURIComponent(verifyEmailToken)}`,
        { replace: true },
      );
    }
  }, [location.pathname, routerNavigate]);

  const navigate: NavigateToView = useCallback(
    (view) => {
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
      routerNavigate(getViewPath(view));
    },
    [currentView, routerNavigate],
  );

  return {
    direction,
    logoWhite,
    navigate,
    setLogoWhite,
  };
}
