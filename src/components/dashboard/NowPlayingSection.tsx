import React from 'react';
import { motion } from 'motion/react';
import { NowPlaying } from '../ui/NowPlaying';
import { NOW_PLAYING } from '../../constants/dashboard';
import { SCALE_IN } from '../../constants/animations';

export function NowPlayingSection() {
  return (
    <motion.div 
      {...SCALE_IN}
      transition={{ ...SCALE_IN.transition, delay: 0.25 }}
      className="flex-1 flex items-center justify-center min-h-[200px]"
    >
      <div className="w-full max-w-2xl">
        <NowPlaying {...NOW_PLAYING} />
      </div>
    </motion.div>
  );
}
