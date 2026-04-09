import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Crown, Zap, UserX } from "lucide-react";
import { toast } from "sonner";
import {
<<<<<<< Updated upstream
   Tooltip,
   TooltipContent,
   TooltipProvider,
   TooltipTrigger,
 } from "@/components/ui/tooltip";
import { ANIMATION_DURATION } from "@/constants/animations";
import { participantsAPI } from "@/services/api";
import { getSocket } from "@/services/socket";
=======
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { ANIMATION_DURATION } from "@/constants/animations";
import { participantsAPI } from "../../services/api";
import { getSocket } from "../../services/socket";
>>>>>>> Stashed changes

interface Participant {
  _id: string;
  nickname: string;
  isPremium: boolean;
  joinedAt: string;
  socketId?: string;
}

interface ParticipantsListProps {
  mode: "attendee" | "dj";
}

function formatTimeAgo(joinedAt: string): string {
  const now = new Date();
  const joined = new Date(joinedAt);
  const secondsAgo = Math.floor((now.getTime() - joined.getTime()) / 1000);

  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`;
  return `${Math.floor(secondsAgo / 3600)}h ago`;
}

export function ParticipantsList({ mode }: ParticipantsListProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [prevCount, setPrevCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const isDj = mode === "dj";

  useEffect(() => {
    if (!isDj) return;

    const eventData = localStorage.getItem("currentEvent");
    const eventId = eventData ? JSON.parse(eventData).eventId : null;

    const fetchParticipants = async () => {
      try {
        if (!eventId) return;

        const list = await participantsAPI.listEventParticipants(eventId);
        const newList = Array.isArray(list) ? list : [];
        
        // Merge with existing state, keeping local UI state intact
        setParticipants((prevParticipants) => {
          // Only update if there are significant changes (different IDs)
          const prevIds = new Set(prevParticipants.map((p) => p._id));
          const newIds = new Set(newList.map((p) => p._id));

          const hasDifference =
            prevIds.size !== newIds.size ||
            [...prevIds].some((id) => !newIds.has(id));

          return hasDifference ? newList : prevParticipants;
        });
        setPrevCount(newList.length);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching participants:", error);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchParticipants();

    // Listen for real-time socket events
    const socket = getSocket();
    if (socket && eventId) {
      // Handle participant kicked
      socket.on("participant_kicked", (data) => {
        setParticipants((prev) => prev.filter((p) => p._id !== data.participantId));
      });

      // Handle participant cooldown
      socket.on("participant_cooldown", (data) => {
        setParticipants((prev) =>
          prev.map((p) =>
            p._id === data.participantId
              ? { ...p, cooldownUntil: new Date(data.cooldownUntil) }
              : p
          )
        );
      });
    }

    // Fallback: Poll every 60 seconds for participants list updates (joins)
    const interval = setInterval(fetchParticipants, 60000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.off("participant_kicked");
        socket.off("participant_cooldown");
      }
    };
  }, [isDj]);

  if (!isDj) return null;

  const eventData = localStorage.getItem("currentEvent");
  const eventId = eventData ? JSON.parse(eventData).eventId : null;

  const premiumCount = participants.filter((p) => p.isPremium).length;
  const connectedCount = participants.filter((p) => p.socketId).length;
  const isDecreasing = participants.length < prevCount;

  const handleRemoveParticipant = (participantId: string) => {
    setParticipants((prev) =>
      prev.filter((p) => p._id !== participantId)
    );
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        layout
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-slate-700" />
            <h3 className="text-lg font-bold text-slate-800">
              Connected Users
            </h3>
          </div>
          <div className="bg-emerald-100 rounded-full px-3 py-1">
            <p className="text-sm font-semibold text-emerald-700">
              {connectedCount}/{participants.length}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-600 mb-1">Total</p>
            <p className="text-xl font-bold text-slate-800">
              {participants.length}
            </p>
          </div>
          <div className="bg-amber-50 rounded-xl p-3">
            <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
              <Crown size={14} /> Premium (Priority) Queue
            </p>
            <p className="text-xl font-bold text-amber-700">{premiumCount}</p>
          </div>
        </div>

        {/* Participants List */}
        {participants.length === 0 ? (
          <motion.div 
            layout
            className="text-center text-slate-500 py-8"
          >
            {loading ? "Loading..." : "No participants yet"}
          </motion.div>
        ) : (
          <motion.div 
            layout
            className="flex flex-col gap-2 max-h-96 overflow-y-auto"
          >
            <AnimatePresence>
              {[...participants].sort((a, b) => {
                if (a.isPremium === b.isPremium) return 0;
                return a.isPremium ? -1 : 1;
              }).map((participant) => (
                <ParticipantItem
                  key={participant._id}
                  participant={participant}
                  isSelected={selectedParticipantId === participant._id}
                  onSelect={(id) =>
                    setSelectedParticipantId(selectedParticipantId === id ? null : id)
                  }
                  onRemove={handleRemoveParticipant}
                  eventId={eventId}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>
    </TooltipProvider>
  );
}

interface ParticipantItemProps {
  participant: Participant;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  eventId: string | null;
}

function ParticipantItem({ participant, isSelected, onSelect, onRemove, eventId }: ParticipantItemProps) {
  const handleAdminAction = async (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      if (action === "Cooldown") {
        const promise = participantsAPI.setCooldown(participant._id, 5 * 60 * 1000, "DJ cooldown");
        await toast.promise(promise, {
          success: `Cooldown applied to "${participant.nickname}"`,
          error: (err: any) => `Failed to apply cooldown: ${err.message}`,
        });
        onRemove(participant._id);
        onSelect(null as any);
      } else if (action === "Kick") {
        const promise = participantsAPI.kickParticipant(participant._id, "Kicked by DJ");
        await toast.promise(promise, {
          success: `Kicked "${participant.nickname}"`,
          error: (err: any) => `Failed to kick: ${err.message}`,
        });
        onRemove(participant._id);
        onSelect(null as any);
      }
    } catch (error) {
      console.error(`Error executing ${action}:`, error);
    }
  };

  return (
    <motion.div
      layout
      exit={{
        opacity: 0,
        x: 20,
        scale: 0.95,
        transition: { duration: 0.3 }
      }}
      onClick={() => onSelect(participant._id)}
      className="bg-slate-50 rounded-xl p-3 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {participant.nickname.charAt(0).toUpperCase()}
        </div>
        
        <AnimatePresence mode="wait">
          {isSelected ? (
            <motion.div
              key="admin-controls"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminAction("Cooldown", e);
                    }}
                    className="p-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-yellow-700 transition-colors"
                  >
                    <Zap size={16} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>Cooldown User</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdminAction("Kick", e);
                    }}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 transition-colors"
                  >
                    <UserX size={16} />
                  </motion.button>
                </TooltipTrigger>
                <TooltipContent>Kick User</TooltipContent>
              </Tooltip>
            </motion.div>
          ) : (
            <motion.div
              key="participant-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.08 }}
              className="flex-1 min-w-0"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">
                {participant.nickname}
              </p>
              <p className="text-xs text-slate-500">
                {formatTimeAgo(participant.joinedAt)}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {participant.isPremium && (
          <Crown size={16} style={{ color: "#facc15", fill: "#facc15" }} />
        )}
        {participant.socketId && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">
              Online
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
