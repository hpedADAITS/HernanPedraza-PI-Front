import React, { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  duration?: number;
}

export function PageTransition({ children, duration = 0.3 }: PageTransitionProps) {
  return (
    <div
      className="animate-fade-in"
      style={{
        animation: `fadeIn ${duration}s ease-out`,
      }}
    >
      {children}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
