import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { PROFILE_IMAGE, THEME_CONFIG } from '../../constants/dashboard';

interface ProfileCardProps {
  mode: 'attendee' | 'dj';
}

export function ProfileCard({ mode }: ProfileCardProps) {
  const isDj = mode === 'dj';
  const config = THEME_CONFIG[isDj ? 'dj' : 'attendee'];
  const subtitle = isDj ? 'DJ on SyncRequest' : '2 years following this DJ';

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={clsx(
        "rounded-3xl p-6 shadow-xl text-white relative overflow-hidden",
        "min-h-[200px] flex flex-col items-center justify-center text-center",
        config.gradient
      )}
    >
      {/* Glossy overlay */}
      <div className="absolute inset-0 bg-white/10" />
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md shadow-inner overflow-hidden border border-white/30">
          <img 
            src={PROFILE_IMAGE}
            alt="Profile" 
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* User Info */}
        <div>
          <h2 className="text-2xl font-bold">Lucas</h2>
          <p className="text-white/80 text-sm font-medium">{subtitle}</p>
        </div>
      </div>
    </motion.div>
  );
}
