import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Layout } from '@/components/layout/Layout';
import { motion, AnimatePresence } from 'motion/react';
import { User, Headphones } from 'lucide-react';
import { useDarkMode } from '@/hooks/useDarkMode';
import logoNormal from '@/assets/logo_normal.png';
import logoWhite from '@/assets/logo_white.png';
import type { NavigateToView } from '@/types';

interface Props {
  onNavigate: NavigateToView;
  logoWhite: boolean;
  onLogoChange: (white: boolean) => void;
}

const ROLE_TRANSITION_DURATION_MS = 650;
const ROLE_TRANSITION_SCALE = 60;
const ROLE_BACKGROUNDS = {
  attendee:
    'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #065f46 0%, #052e22 100%)',
  dj: 'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #1e3a8a 0%, #0c1e4a 100%)',
} as const;

export function RoleSelection({ onNavigate, logoWhite: isLogoWhite, onLogoChange }: Props) {
  const [isDarkMode] = useDarkMode();
  const [expandingCircle, setExpandingCircle] = useState<{
    x: number;
    y: number;
    background: string;
  } | null>(null);

  const handleRoleClick = (
    role: 'attendee' | 'dj',
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    if (expandingCircle) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const background = ROLE_BACKGROUNDS[role];

    setExpandingCircle({ x, y, background });

    setTimeout(() => {
      onLogoChange(true);
      onNavigate(role === 'attendee' ? 'attendee-login' : 'dj-login');
      setExpandingCircle(null);
    }, ROLE_TRANSITION_DURATION_MS);
  };

  return (
    <Layout theme="white" className="items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-12 md:gap-18 -mt-8 scale-90 md:scale-100">
        {/* Logo */}
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="drop-shadow-xl"
        >
          <img
            src={isDarkMode ? logoWhite : logoNormal}
            alt="SyncRequest"
            className="h-32 w-auto max-w-[86vw] object-contain sm:h-36 md:h-44 lg:h-48"
          />
        </motion.div>

        {/* Cards Container */}
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Attendee Card */}
          <motion.button
            initial={{ x: -16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: 0.1,
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            whileHover={{
              scale: 1.01,
              y: -1,
              transition: { duration: 0.12, ease: 'easeOut' },
            }}
            whileTap={{ scale: 0.99, transition: { duration: 0.08 } }}
            onClick={(e) => handleRoleClick('attendee', e)}
            disabled={Boolean(expandingCircle)}
            className="group relative w-72 h-80 rounded-xl overflow-hidden shadow-xl shadow-emerald-900/10 hover:shadow-2xl hover:shadow-emerald-900/20 transition-shadow duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#77c76e] to-[#38997a]" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-150" />

            <div className="relative h-full flex flex-col items-center justify-center gap-8 p-6 text-white">
              <h2 className="text-3xl font-normal tracking-wide">Attendee</h2>
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <User
                  size={80}
                  strokeWidth={1.5}
                  fill="currentColor"
                  className="text-white"
                />
              </div>
            </div>
          </motion.button>

          {/* DJ Card */}
          <motion.button
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{
              delay: 0.15,
              duration: 0.3,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            whileHover={{
              scale: 1.01,
              y: -1,
              transition: { duration: 0.12, ease: 'easeOut' },
            }}
            whileTap={{ scale: 0.99, transition: { duration: 0.08 } }}
            onClick={(e) => handleRoleClick('dj', e)}
            disabled={Boolean(expandingCircle)}
            className="group relative w-72 h-80 rounded-xl overflow-hidden shadow-xl shadow-blue-900/10 hover:shadow-2xl hover:shadow-blue-900/20 transition-shadow duration-200"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#4ca0f1] to-[#61c8fa]" />
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-150" />

            <div className="relative h-full flex flex-col items-center justify-center gap-8 p-6 text-white">
              <h2 className="text-3xl font-normal tracking-wide">DJ</h2>
              <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-inner border border-white/30">
                <Headphones
                  size={80}
                  strokeWidth={1.5}
                  className="text-white"
                />
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      {createPortal(
        <AnimatePresence>
          {expandingCircle && (
            <motion.div
              initial={{ scale: 0.35, opacity: 0.9 }}
              animate={{ scale: ROLE_TRANSITION_SCALE, opacity: 1 }}
              transition={{
                duration: ROLE_TRANSITION_DURATION_MS / 1000,
                ease: [0.76, 0, 0.24, 1],
              }}
              style={{
                position: 'fixed',
                left: expandingCircle.x,
                top: expandingCircle.y,
                width: 200,
                height: 200,
                borderRadius: '50%',
                background: expandingCircle.background,
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 9999,
                willChange: 'transform',
              }}
            />
          )}
        </AnimatePresence>,
        document.body,
      )}
    </Layout>
  );
}
