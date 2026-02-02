import React from 'react';
import { motion } from 'motion/react';
import { clsx } from 'clsx';
import { QUEUE_SONGS, THEME_CONFIG } from '../../constants/dashboard';
import { SLIDE_UP, ANIMATION_STAGGER, ANIMATION_DURATION } from '../../constants/animations';

interface QueueListProps {
  mode: 'attendee' | 'dj';
}

export function QueueList({ mode }: QueueListProps) {
  const isDj = mode === 'dj';
  const primaryColor = THEME_CONFIG[isDj ? 'dj' : 'attendee'].primaryColor;

  return (
    <motion.div 
      {...SLIDE_UP}
      transition={{ ...SLIDE_UP.transition, delay: 0.15 }}
      className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-xl flex-1 min-h-[400px]"
    >
      <h3 className="text-slate-500 font-bold mb-4 uppercase text-xs tracking-wider">
        Up Next
      </h3>
      
      <div className="flex flex-col gap-4">
        {QUEUE_SONGS.map((song, i) => (
          <QueueItem 
            key={i}
            song={song}
            position={i + 1}
            isFirst={i === 0}
            primaryColor={primaryColor}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface QueueItemProps {
  song: typeof QUEUE_SONGS[number];
  position: number;
  isFirst: boolean;
  primaryColor: string;
}

function QueueItem({ song, position, isFirst, primaryColor }: QueueItemProps) {
  return (
    <motion.div 
      whileHover={{ backgroundColor: 'rgba(248, 250, 252, 0.7)' }}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className="flex items-center gap-4 group cursor-pointer p-3 rounded-xl"
    >
      {/* Position Badge */}
      <div className={clsx(
        "w-12 h-12 rounded-xl shadow-md flex items-center justify-center text-white font-bold text-lg flex-shrink-0",
        isFirst ? primaryColor : "bg-slate-400"
      )}>
        {position}
      </div>
      
      {/* Song Info */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="font-semibold text-slate-800 truncate">{song.title}</span>
        <span className="text-xs text-slate-500">{song.artist}</span>
      </div>
      
      {/* Vote Count */}
      <div className="flex flex-col items-end gap-1">
        <span className="text-sm font-semibold text-slate-700">{song.votes}</span>
        <span className="text-xs text-slate-400">votes</span>
      </div>
    </motion.div>
  );
}
