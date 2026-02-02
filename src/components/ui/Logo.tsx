import React from 'react';
import { clsx } from 'clsx';
import logoNormal from '../../assets/logo_normal.png';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
}

export function Logo({ className, variant = 'light' }: LogoProps) {
  const isDark = variant === 'dark';
  
  return (
    <div className={clsx("flex items-center gap-3 select-none", className)}>
      {/* Image Logo */}
      <div className={clsx(
        "w-20 h-20 flex items-center justify-center rounded-lg transition-colors",
        isDark ? "bg-slate-900" : "bg-white"
      )}>
        <img 
          src={logoNormal} 
          alt="Sync Rekuest Logo"
          className="w-full h-full object-contain"
        />
      </div>
    </div>
  );
}
