import React, { ReactNode } from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { Sun } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  theme?: 'green' | 'blue' | 'white';
  className?: string;
  showNav?: boolean;
}

export function Layout({ children, theme = 'green', className, showNav = true }: LayoutProps) {
  const isWhite = theme === 'white';
  const isGreen = theme === 'green';

  const getBackground = () => {
    if (isWhite) return "bg-white";
    if (isGreen) return "linear-gradient(135deg, #77c76e 0%, #38997a 100%)";
    return "linear-gradient(135deg, #4ca0f1 0%, #61c8fa 100%)";
  };

  return (
    <motion.div 
      className={clsx(
        "relative w-full h-full overflow-y-auto flex flex-col font-sans",
        isWhite ? "text-slate-800" : "text-white"
      )}
      animate={{ 
        background: getBackground()
      }}
      transition={{ duration: 0 }}
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
           <button className="pointer-events-auto bg-white shadow-sm border border-slate-200 rounded-full px-4 py-2 flex items-center gap-2 text-slate-700 font-medium transition-transform hover:scale-105 active:scale-95">
             <Sun size={18} className="animate-spin-slow" />
             <span className="text-sm">Light</span>
           </button>
        </header>
      )}

      {/* Main Content */}
      <div className={clsx("relative z-10 flex-1 flex flex-col pb-24 md:pb-28", className)}>
        {children}
      </div>

      {/* Footer */}
      {showNav && (
        <footer className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex justify-between items-end pointer-events-none z-50">
           {/* Copyright - Centered Absolutely */}
           <div className="absolute left-1/2 bottom-8 -translate-x-1/2 text-center text-xs opacity-60 font-light pointer-events-none w-full">
             © 2025 SyncRequest
           </div>

           <div /> {/* Left Spacer */}

           {/* Language Toggle */}
           <button className="pointer-events-auto bg-white shadow-sm border border-slate-200 rounded-full h-10 px-4 flex items-center justify-center font-bold text-xs text-slate-800 transition-transform hover:scale-105 active:scale-95">
             EN
           </button>
        </footer>
      )}
    </motion.div>
  );
}