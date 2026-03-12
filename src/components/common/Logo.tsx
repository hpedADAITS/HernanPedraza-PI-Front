import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import logoWhite from '@/assets/logo_white.png';
import logoNormal from '@/assets/logo_normal.png';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
  useWhite?: boolean;
}

export function Logo({ className, variant = 'light', useWhite = false }: LogoProps) {
  const useLogo = useWhite ? logoWhite : logoNormal;
    
    return (
      <div className={clsx("flex items-center gap-3 select-none", className)}>
        {/* Image Logo */}
        <div className={clsx(
          "w-32 h-32 flex items-center justify-center rounded-lg transition-colors",
          variant === 'dark' ? "bg-slate-900" : "bg-transparent"
        )}>
          <motion.img 
            key={useLogo}
            src={useLogo} 
            alt="Sync Rekuest Logo"
            className="w-full h-full object-contain"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
}
