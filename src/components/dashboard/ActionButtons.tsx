import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ThumbsUp, ThumbsDown, LogOut, Settings, Plus } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ANIMATION_DURATION } from '@/constants/animations';
import { songsAPI, votesAPI, clearToken } from '@/services/api';
import * as socket from '@/services/socket';
import { disconnectSocket } from '@/services/socket';
import type { View } from '@/types';

interface ActionButtonsProps {
  mode: 'attendee' | 'dj';
  onNavigate: (view: View) => void;
}

export function ActionButtons({ mode, onNavigate }: ActionButtonsProps) {
  const isDj = mode === 'dj';

  const handleLeaveParty = () => {
    clearToken();
    disconnectSocket();
    localStorage.removeItem('currentEvent');
    localStorage.removeItem('currentParticipant');
    localStorage.removeItem('user');
    onNavigate(isDj ? 'dj-login' : 'attendee-login');
  };

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 items-center">
        {!isDj && <VotingButtons />}

        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl">
          <ActionButton
            icon={Plus}
            label="Queue Song"
            onClick={() =>
              onNavigate(isDj ? 'dj-song-select' : 'attendee-song-select')
            }
            variant="primary"
          />

          <ActionButton
            icon={LogOut}
            label="Leave Party"
            onClick={handleLeaveParty}
            variant="primary"
          />

          {isDj && (
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onNavigate('dj-settings')}
                  className="w-14 h-14 bg-slate-600 hover:bg-slate-700 rounded-xl shadow-lg flex items-center justify-center text-white flex-shrink-0 transition-colors"
                >
                  <Settings size={24} />
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

interface CurrentSong {
  _id: string;
  title: string;
  artist: string;
}

function VotingButtons() {
  const [currentSong, setCurrentSong] = useState<CurrentSong | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    const eventRaw = localStorage.getItem('currentEvent');
    if (!eventRaw) return;

    let eventId: string;
    try {
      const parsed = JSON.parse(eventRaw);
      eventId = parsed.eventId || parsed._id || parsed.id;
    } catch {
      eventId = eventRaw;
    }
    if (!eventId) return;

    songsAPI
      .getQueue(eventId)
      .then((queue) => {
        if (queue && queue.length > 0) {
          setCurrentSong(queue[0]);
        }
      })
      .catch(() => {
        // queue fetch failed silently
      });

    const handleQueueUpdate = (data: any) => {
      if (data?.queue && data.queue.length > 0) {
        setCurrentSong(data.queue[0]);
      } else {
        setCurrentSong(null);
      }
    };

    try {
      socket.onQueueUpdated(handleQueueUpdate);
    } catch {
      // socket not initialized
    }

    return () => {
      try {
        socket.off('queue_updated', handleQueueUpdate);
      } catch {
        // socket already gone
      }
    };
  }, []);

  const handleVote = async (value: 1 | -1) => {
    if (!currentSong) {
      toast.info('No song playing');
      return;
    }
    if (voting) return;

    const eventRaw = localStorage.getItem('currentEvent');
    const participantRaw = localStorage.getItem('currentParticipant');
    if (!eventRaw || !participantRaw) {
      toast.error('Session data missing');
      return;
    }

    let eventId: string;
    try {
      const parsed = JSON.parse(eventRaw);
      eventId = parsed.eventId || parsed._id || parsed.id;
    } catch {
      eventId = eventRaw;
    }

    let participantId: string;
    try {
      const parsed = JSON.parse(participantRaw);
      participantId = parsed._id || parsed.id || parsed;
    } catch {
      participantId = participantRaw;
    }

    setVoting(true);
    try {
      await votesAPI.castVote(currentSong._id, participantId, value);
      socket.castVote(eventId, currentSong._id, participantId, value);
      const direction = value === 1 ? '👍' : '👎';
      toast.success(`${direction} ${currentSong.title}`);
    } catch (err: any) {
      toast.error(err?.message || 'Vote failed');
    } finally {
      setVoting(false);
    }
  };

  return (
    <div className="flex gap-6 justify-center w-full">
      <VoteButton
        icon={ThumbsUp}
        color="emerald"
        label="Vote Up"
        onClick={() => handleVote(1)}
        disabled={!currentSong || voting}
      />
      <VoteButton
        icon={ThumbsDown}
        color="red"
        label="Vote Down"
        onClick={() => handleVote(-1)}
        disabled={!currentSong || voting}
      />
    </div>
  );
}

interface VoteButtonProps {
  icon: React.ElementType;
  color: 'emerald' | 'red';
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function VoteButton({
  icon: Icon,
  color,
  label,
  onClick,
  disabled,
}: VoteButtonProps) {
  const colors = {
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
    red: 'bg-red-600 hover:bg-red-700',
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          onClick={onClick}
          disabled={disabled}
          transition={{ duration: ANIMATION_DURATION.fast }}
          className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl shadow-lg flex items-center justify-center text-white transition-colors ${colors[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Icon size={36} fill="currentColor" />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant: 'primary';
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant,
}: ActionButtonProps) {
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
