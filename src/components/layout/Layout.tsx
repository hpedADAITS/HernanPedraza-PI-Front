import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import { Logo } from '../ui/Logo';
import { useDarkMode } from '../../hooks/useDarkMode';

interface LayoutProps {
  children: ReactNode;
  theme?: 'green' | 'blue' | 'white';
  className?: string;
  showNav?: boolean;
}

export function Layout({ children, theme = 'green', className, showNav = true }: LayoutProps) {
  const [isDarkMode, setIsDarkMode] = useDarkMode();
  const isWhite = theme === 'white';
  const isGreen = theme === 'green';

  const getBackground = () => {
    if (isDarkMode) return "#1a1a1a";
    if (isWhite) return "#ffffff";
    if (isGreen) return "linear-gradient(135deg, #77c76e 0%, #38997a 100%)";
    return "linear-gradient(135deg, #4ca0f1 0%, #61c8fa 100%)";
  };

  const getTextColor = () => {
    if (isDarkMode) return "text-white";
    if (isWhite) return "text-slate-800";
    return "text-white";
  };

  return (
    <motion.div 
      key={`layout-${isDarkMode}`}
      className={clsx(
        "relative w-full h-full overflow-y-auto flex flex-col font-sans",
        getTextColor()
      )}
      style={{ 
        background: getBackground(),
        transition: 'background 0.3s ease'
      }}
    >
      {/* Background Pattern / Noise for texture (only on colored backgrounds) */}
      {!isWhite && (
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')] mix-blend-overlay" />
      )}

      {/* Top Bar */}
      {showNav && (
        <header className="absolute top-0 left-0 right-0 z-50 p-6 md:p-8 flex justify-between items-start pointer-events-none">
           <div /> {/* Left Spacer */}

           {/* Theme Toggle */}
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={clsx(
                    "pointer-events-auto shadow-sm border rounded-full px-4 py-2 flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95",
                    isDarkMode 
                      ? "bg-slate-800 border-slate-600 text-white" 
                      : "bg-white border-slate-200 text-slate-700"
                  )}
                >
                  {isDarkMode ? <Moon size={18} /> : <Sun size={18} className="animate-spin-slow" />}
                  <span className="text-sm">{isDarkMode ? 'Dark' : 'Light'}</span>
                </button>
        </header>
      )}

      {/* Main Content */}
      <div className={clsx("relative z-10 flex-1 flex flex-col pb-24 md:pb-28", className)}>
        {children}
      </div>

      {/* Footer */}
      {showNav && (
        <footer className="relative p-6 md:p-8 flex justify-center items-end z-50">
          <div className="text-center text-xs opacity-60 font-light pointer-events-none">
            © 2025 SyncRequest
          </div>
        </footer>
      )}
    </motion.div>
  );
}