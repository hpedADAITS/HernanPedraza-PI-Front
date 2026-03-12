import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users } from "lucide-react";
import { participantsAPI } from "@/services/api";
import { getSocket } from "@/services/socket";

interface ConnectedUser {
  _id: string;
  nickname: string;
  joinedAt: string;
  socketId?: string;
}

interface ConnectedUsersProps {
  mode: "attendee" | "dj";
  isDarkMode?: boolean;
}

export function ConnectedUsers({ mode, isDarkMode = false }: ConnectedUsersProps) {
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
       className="rounded-3xl shadow-lg p-6 flex flex-col gap-4"
       style={{
         backgroundColor: isDarkMode ? "rgba(100, 116, 139, 0.8)" : "rgb(255, 255, 255)",
         color: isDarkMode ? "white" : "inherit"
       }}
     >
      <div className="flex items-center gap-3">
        <Users size={24} className={isDarkMode ? "text-white" : "text-slate-700"} />
        <h3 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-slate-800"}`}>
          Connected Users
        </h3>
        <span className={`ml-auto text-sm font-semibold px-3 py-1 rounded-full ${isDarkMode ? "bg-emerald-900/40 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}>
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
          className="flex flex-wrap justify-start gap-6 max-h-64 overflow-y-auto pr-1"
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
                <p className={`text-sm font-semibold text-center truncate w-full px-1 ${isDarkMode ? "text-white" : "text-slate-800"}`}>
                  {user.nickname}
                </p>

                {/* Online Indicator */}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className={`text-xs font-medium ${isDarkMode ? "text-emerald-300" : "text-emerald-600"}`}>
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
