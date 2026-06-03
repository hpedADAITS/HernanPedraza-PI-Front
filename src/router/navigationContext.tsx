import React, { createContext, useContext, type ReactNode } from 'react';
import type { NavigateToView } from '@/types';

const ViewNavigationContext = createContext<NavigateToView | null>(null);

interface ViewNavigationProviderProps {
  children: ReactNode;
  navigate: NavigateToView;
}

export function ViewNavigationProvider({
  children,
  navigate,
}: ViewNavigationProviderProps) {
  return (
    <ViewNavigationContext.Provider value={navigate}>
      {children}
    </ViewNavigationContext.Provider>
  );
}

export function useViewNavigate(fallback?: NavigateToView) {
  const navigate = useContext(ViewNavigationContext) ?? fallback;
  if (!navigate) throw new Error('useViewNavigate requires a provider');
  return navigate;
}
