import React from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, LogOut, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { ANIMATION_DURATION } from '../../constants/animations';

interface ActionButtonsProps {
  mode: 'attendee' | 'dj';
  onNavigate: (view: string) => void;
}

export function ActionButtons({ mode, onNavigate }: ActionButtonsProps) {
  const isDj = mode === 'dj';

  return (
    <div className="flex flex-col gap-6 items-center">
      {/* Attendee: Voting Section */}
      {!isDj && <VotingButtons />}

      {/* Action Buttons Row */}
      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
        <ActionButton
          icon={Plus}
          label="Queue Song"
          onClick={() => onNavigate(isDj ? 'dj-song-select' : 'attendee-song-select')}
          variant="primary"
        />
        
        <ActionButton
          icon={LogOut}
          label="Leave Party"
          onClick={() => onNavigate(isDj ? 'dj-login' : 'attendee-login')}
          variant="primary"
        />

        {isDj && (
          <motion.button
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigate('dj-settings')}
            className="w-14 h-14 bg-slate-600 hover:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center text-white flex-shrink-0 transition-colors"
            title="Settings"
          >
            <Settings size={24} />
          </motion.button>
        )}
      </div>
    </div>
  );
}

function VotingButtons() {
  return (
    <div className="flex gap-6 justify-center w-full">
      <VoteButton
        icon={ThumbsUp}
        color="emerald"
        label="Vote Up"
        onClick={() => toast.success("Voted Up!")}
      />
      <VoteButton
        icon={ThumbsDown}
        color="red"
        label="Vote Down"
        onClick={() => toast.success("Voted Down!")}
      />
    </div>
  );
}

interface VoteButtonProps {
  icon: React.ElementType;
  color: 'emerald' | 'red';
  label: string;
  onClick: () => void;
}

function VoteButton({ icon: Icon, color, label, onClick }: VoteButtonProps) {
  const colors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    red: 'bg-red-600 hover:bg-red-700'
  };

  return (
    <motion.button 
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      title={label}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-lg flex items-center justify-center text-white transition-colors ${colors[color]}`}
    >
      <Icon size={36} fill="currentColor" />
    </motion.button>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant: 'primary';
}

function ActionButton({ icon: Icon, label, onClick, variant }: ActionButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      transition={{ duration: ANIMATION_DURATION.fast }}
      className="flex-1 h-14 bg-slate-600 hover:bg-slate-700 text-white rounded-xl shadow-lg flex items-center justify-center gap-3 font-semibold text-lg transition-colors"
    >
      <Icon size={22} /> {label}
    </motion.button>
  );
}
