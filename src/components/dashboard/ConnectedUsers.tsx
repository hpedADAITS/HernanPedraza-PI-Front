import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users } from "lucide-react";
import { participantsAPI } from "../../services/api";
import { getSocket } from "../../services/socket";

interface ConnectedUser {
  _id: string;
  nickname: string;
  joinedAt: string;
  socketId?: string;
}

interface ConnectedUsersProps {
  mode: "attendee" | "dj";
}

export function ConnectedUsers({ mode }: ConnectedUsersProps) {
  const [users, setUsers] = useState<ConnectedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const isAttendee = mode === "attendee";

  useEffect(() => {
    if (!isAttendee) return;

    const eventData = localStorage.getItem("currentEvent");
    const eventId = eventData ? JSON.parse(eventData).eventId : null;

    const fetchUsers = async () => {
      try {
        if (!eventId) return;

        const list = await participantsAPI.listEventParticipants(eventId);
        const userList = Array.isArray(list) ? list : [];
        
        // Show all users (filter out kicked/left ones via API)
        setUsers(userList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching connected users:", error);
        setLoading(false);
      }
    };

    fetchUsers();

    // Listen for real-time updates via socket
    const socket = getSocket();
    if (socket && eventId) {
      // Handle new participant joining
      const handleParticipantJoined = (data: any) => {
        console.log("Participant joined:", data);
        setUsers((prev) => {
          const exists = prev.some((u) => u._id === data.participantId);
          if (!exists) {
            return [
              ...prev,
              {
                _id: data.participantId,
                nickname: data.nickname,
                joinedAt: data.joinedAt,
                socketId: "connected",
              },
            ];
          }
          return prev;
        });
      };

      // Handle participant leaving
      const handleParticipantLeft = (data: any) => {
        console.log("Participant left:", data);
        setUsers((prev) => prev.filter((u) => u._id !== data.participantId));
      };

      // Handle participant kicked
      const handleParticipantKicked = (data: any) => {
        console.log("Participant kicked:", data);
        setUsers((prev) => prev.filter((u) => u._id !== data.participantId));
      };

      socket.on("participant_joined", handleParticipantJoined);
      socket.on("participant_left", handleParticipantLeft);
      socket.on("participant_kicked", handleParticipantKicked);

      return () => {
        socket.off("participant_joined", handleParticipantJoined);
        socket.off("participant_left", handleParticipantLeft);
        socket.off("participant_kicked", handleParticipantKicked);
      };
    }
  }, [isAttendee]);

  if (!isAttendee) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className="bg-white rounded-3xl shadow-lg p-6 flex flex-col gap-4"
    >
      <div className="flex items-center gap-3">
        <Users size={24} className="text-slate-700" />
        <h3 className="text-lg font-bold text-slate-800">
          Connected Users
        </h3>
        <span className="ml-auto bg-emerald-100 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
          {users.length}
        </span>
      </div>

      {/* Debug: show loading state */}
      {loading && (
        <motion.div
          layout
          className="text-center text-slate-400 py-8"
        >
          Loading participants...
        </motion.div>
      )}

      {/* Users Grid */}
      {!loading && users.length === 0 ? (
        <motion.div
          layout
          className="text-center text-slate-500 py-8"
        >
          No other participants connected
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"
        >
          <AnimatePresence>
            {users.map((user) => (
              <motion.div
                key={user._id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.2 },
                }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="flex flex-col items-center gap-2"
              >
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-xl shadow-md">
                  {user.nickname.charAt(0).toUpperCase()}
                </div>

                {/* Name */}
                <p className="text-sm font-semibold text-slate-800 text-center truncate w-full px-1">
                  {user.nickname}
                </p>

                {/* Online Indicator */}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">
                    Online
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
