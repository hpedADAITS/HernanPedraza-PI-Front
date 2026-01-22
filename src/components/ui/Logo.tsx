import React from 'react';
import { Headphones, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
}

export function Logo({ className, variant = 'light' }: LogoProps) {
  const isLight = variant === 'light';
  
  return (
    <div className={clsx("flex items-center gap-3 select-none", className)}>
      {/* Icon Logo */}
      <div className="relative w-16 h-16 flex items-center justify-center">
         {/* We simulate the logo using icons for better quality than a raster */}
         <Headphones 
           size={56} 
           className={clsx(
             "drop-shadow-sm",
             variant === 'color' ? "text-blue-600" : "text-white"
           )} 
           strokeWidth={2.5} 
         />
         <div className="absolute inset-0 flex items-center justify-center pt-1">
            <RefreshCw 
              size={28} 
              className={clsx(
                "animate-spin-slow-reverse",
                variant === 'color' ? "text-emerald-500" : "text-white/90"
              )} 
              strokeWidth={3} 
            />
         </div>
      </div>
      
      {/* Text Logo */}
      <div className={clsx("text-4xl font-bold tracking-tight flex flex-row items-baseline")}>
        <span className={clsx(
          variant === 'color' ? "text-blue-900" : "text-white"
        )}>Sync</span>
        <span className={clsx(
          variant === 'color' ? "text-emerald-600" : "text-white"
        )}>Request</span>
      </div>
    </div>
  );
}
