import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { useDarkMode } from '@/hooks/useDarkMode';
import logoAsset from '@/assets/logo_normal.png';
import logoWhiteAsset from '@/assets/logo_white.png';

interface LayoutProps {
  children: ReactNode;
  theme?: 'green' | 'blue' | 'white';
  className?: string;
  showNav?: boolean;
}

export function Layout({
  children,
  theme = 'green',
  className,
  showNav = true,
}: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const isWhite = theme === 'white';
  const isGreen = theme === 'green';

  const getBackground = () => {
    if (isDarkMode) return '#0b1220';
    if (isWhite) return '#f8fafc';
    if (isGreen) return 'linear-gradient(135deg, #77c76e 0%, #38997a 100%)';
    return 'linear-gradient(135deg, #4ca0f1 0%, #61c8fa 100%)';
  };

  const getTextColor = () => {
    if (isDarkMode) return 'text-slate-100';
    if (isWhite) return 'text-slate-900';
    return 'text-white';
  };

  const logoSrc = isDarkMode || !isWhite ? logoWhiteAsset : logoAsset;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
      className={clsx(
        'relative w-full h-full overflow-y-auto flex flex-col font-sans',
        getTextColor(),
      )}
      style={{
        background: getBackground(),
        transition: 'background 0.3s ease',
      }}
    >
      {/* Top Bar */}
      {showNav && (
        <header className="relative z-50 px-6 md:px-10 pt-4 flex items-center justify-between">
          <div></div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className={clsx(
              'flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium border transition-colors',
              isDarkMode
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white/80 hover:text-white backdrop-blur-md'
                : isWhite
                  ? 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
                  : 'bg-white/[0.12] hover:bg-white/[0.2] border-white/20 text-white backdrop-blur-md',
            )}
          >
            {isDarkMode ? (
              <Moon size={14} strokeWidth={2.25} />
            ) : (
              <Sun size={14} strokeWidth={2.25} />
            )}
            <span>{isDarkMode ? 'Dark' : 'Light'}</span>
          </button>
        </header>
      )}

      {/* Main Content */}
      <div
        className={clsx(
          'relative z-10 flex-1 flex flex-col pb-10',
          className,
        )}
      >
        {children}
      </div>

      {/* Footer */}
      {showNav && (
        <footer className="relative px-6 pb-3 pt-1 flex justify-center items-end z-50">
          <div
            className={clsx(
              'text-center text-[11.5px] font-medium pointer-events-none',
              isDarkMode || !isWhite ? 'text-white/50' : 'text-slate-400',
            )}
          >
            © 2025 SyncRequest
          </div>
        </footer>
      )}
    </motion.div>
  );
}
