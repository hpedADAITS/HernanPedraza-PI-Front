import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Crown } from "lucide-react";
import { participantsAPI } from "../../services/api";

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
  const isDj = mode === "dj";

  useEffect(() => {
    if (!isDj) return;

    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const eventData = localStorage.getItem("currentEvent");
        if (!eventData) return;

        const parsed = JSON.parse(eventData);
        const eventId = parsed.eventId;

        if (!eventId) return;

        const list = await participantsAPI.listEventParticipants(eventId);
        const newList = Array.isArray(list) ? list : [];
        setParticipants(newList);
        setPrevCount(newList.length);
      } catch (error) {
        console.error("Error fetching participants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipants();
    // Poll every 5 seconds for live updates
    const interval = setInterval(fetchParticipants, 5000);

    return () => clearInterval(interval);
  }, [isDj]);

  if (!isDj) return null;

  const premiumCount = participants.filter((p) => p.isPremium).length;
  const connectedCount = participants.filter((p) => p.socketId).length;
  const isDecreasing = participants.length < prevCount;

  return (
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
          {[...participants].sort((a, b) => {
            if (a.isPremium === b.isPremium) return 0;
            return a.isPremium ? -1 : 1;
          }).map((participant) => (
            <motion.div
              key={participant._id}
              layout
              className="bg-slate-50 rounded-xl p-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {participant.nickname.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-800">
                    {participant.nickname}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatTimeAgo(participant.joinedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {participant.isPremium && (
                  <Crown size={16} className="text-yellow-400 fill-yellow-400" />
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
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
