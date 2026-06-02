import React from 'react';
import { LazyMotion, domAnimation, m } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import type { NavigateToView } from '@/types';

interface Props {
  onNavigate?: NavigateToView;
}

export function Banned({ onNavigate }: Props) {
  return (
    <div
      className="w-full min-h-screen overflow-hidden font-sans text-white flex items-center justify-center px-5"
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #1e3a8a 0%, #0c1e4a 100%)',
      }}
    >
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md text-center"
        >
          <m.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 32 }}
            className="flex justify-center mb-6"
          >
            <AlertCircle size={64} className="text-red-400" strokeWidth={1.5} />
          </m.div>
          <h1 className="text-2xl font-semibold mb-3 text-red-400">Banned</h1>
          <p className="text-slate-300 mb-6">
            This account cannot join the event.
          </p>
          <m.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (onNavigate) {
                onNavigate('role-selection');
              } else {
                window.location.href = '/';
              }
            }}
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
          >
            Back to Home
          </m.button>
        </m.div>
      </LazyMotion>
    </div>
  );
}
