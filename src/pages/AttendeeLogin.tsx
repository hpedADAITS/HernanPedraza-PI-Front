import React, { useState, useRef, useEffect } from "react";
import jsQR from "jsqr";
<<<<<<< Updated upstream
import { Layout } from "@/components/layout/Layout";
import { Logo } from "@/components/common";
=======
import { Layout } from "../components/layout/Layout";
>>>>>>> Stashed changes
import { motion, AnimatePresence } from "motion/react";
import { Ticket, ArrowLeft, QrCode, X, Camera } from "lucide-react";
import { toast } from "sonner";
import { participantsAPI, eventsAPI, authAPI } from "@/services/api";
import * as socket from "@/services/socket";

interface Props {
  onNavigate: (view: any) => void;
  logoWhite?: boolean;
  onLogoChange?: (white: boolean) => void;
}

export function AttendeeLogin({ onNavigate, logoWhite = false, onLogoChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [eventCode, setEventCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [showQRScanner, setShowQRScanner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    if (!showQRScanner) return;
    scanningRef.current = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            scanQRCode();
          };
        }
      } catch (error) {
        toast.error("Unable to access camera. Please check permissions.");
        setShowQRScanner(false);
      }
    };

    startCamera();

    return () => {
      scanningRef.current = false;
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, [showQRScanner]);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    if (!context) return;

    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    try {
      const code = decodeQRCode(data, canvas.width, canvas.height);
      if (code) {
        setEventCode(code.toUpperCase());
        setShowQRScanner(false);
        toast.success("Event code scanned!");
        return;
      }
    } catch (error) {
      // Continue scanning if decoding fails
    }

    if (scanningRef.current) {
      requestAnimationFrame(scanQRCode);
    }
  };

  const decodeQRCode = (
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): string | null => {
    const result = jsQR(data, width, height);
    if (!result) return null;
    const raw = result.data.trim();
    try {
      const url = new URL(raw);
      const code = url.searchParams.get("code");
      if (code) return code.toUpperCase();
    } catch {
      // Not a URL, treat as raw code
    }
    return raw.length >= 4 ? raw.toUpperCase() : null;
  };

  const handleJoinEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!eventCode.trim() || !nickname.trim()) {
        throw new Error("Please enter both event code and nickname");
      }

      // Step 1: Create/register attendee account
      const tempEmail = `attendee_${Date.now()}@syncrekuest.local`;
      const tempPassword = Math.random().toString(36).substring(2, 15);

      const authResult = await authAPI.register(
        tempEmail,
        tempPassword,
        nickname,
        "ATTENDEE",
      );

      if (!authResult || !authResult.token) {
        throw new Error("Failed to create account");
      }

      // Step 2: Validate event code against database
      const event = await eventsAPI.getEventByAccessCode(eventCode);

      if (!event) {
        throw new Error("Event not found. Please check the event code.");
      }

      // Step 3: Join the event as a participant
      const participant = await participantsAPI.joinEvent(event._id || event.id, nickname);

      if (!participant) {
        throw new Error("Failed to join event");
      }

      // Store attendee session data
       const sessionData = {
         nickname,
         eventCode,
         eventId: event._id || event.id,
         participantId: participant._id || participant.id,
         joinedAt: new Date().toISOString(),
         ownerName: event.ownerId?.displayName || "DJ",
       };
       localStorage.setItem("user", JSON.stringify({ displayName: nickname }));
       localStorage.setItem("currentEvent", JSON.stringify(sessionData));
       
       // Store participant data
       localStorage.setItem("currentParticipant", JSON.stringify({
         _id: participant._id || participant.id,
         nickname,
         eventId: event._id || event.id
       }));

      toast.success("Account created and joined event successfully!");
      // Initialize socket connection
      socket.initSocket(authResult.authToken || authResult.token);
      onNavigate("attendee-dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to join event",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout theme="green" className="items-center justify-center min-h-screen">
      <motion.div
         initial={{ y: -12, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
         className="mb-12"
       >
         <h1 className="text-4xl font-bold text-white">SyncRequst</h1>
       </motion.div>

      <motion.form
        onSubmit={handleJoinEvent}
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.08, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[400px] px-6 flex flex-col gap-5"
      >
        {/* Nickname Input */}
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none">
            👤
          </div>
          <input
            type="text"
            placeholder="Your Nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
            className="w-full h-16 pl-16 pr-6 rounded-2xl bg-white shadow-lg shadow-emerald-900/5 border-none outline-none text-lg text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        {/* Event Code Input with QR Scanner */}
        <div className="relative group">
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-800 pointer-events-none">
            <Ticket size={26} strokeWidth={2} />
          </div>
          <input
            type="text"
            placeholder="Event Code"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value.toUpperCase())}
            required
            className="w-full h-16 pl-16 pr-14 rounded-2xl bg-white shadow-lg shadow-emerald-900/5 border-none outline-none text-lg text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-white/50 transition-all"
          />
          <motion.button
            type="button"
            onClick={() => setShowQRScanner(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-600 transition-colors p-2 hover:bg-slate-100 rounded-lg"
            title="Scan QR Code"
          >
            <QrCode size={20} strokeWidth={2} />
          </motion.button>
        </div>

        {/* Join Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
          className="h-14 mt-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[10px] shadow-lg shadow-emerald-900/20 text-lg font-medium tracking-wide flex items-center justify-center transition-all w-[160px] mx-auto disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Join Event"
          )}
        </motion.button>
      </motion.form>

      {/* Back Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          whileHover={{ scale: 1.05, transition: { duration: 0.12 } }}
          whileTap={{ scale: 0.95, transition: { duration: 0.08 } }}
          onClick={() => onNavigate("role-selection")}
          className="bg-white px-8 py-4 rounded-full shadow-xl shadow-black/10 text-xl font-light text-slate-800 flex items-center gap-2 border border-slate-100"
        >
          <ArrowLeft size={20} />
          Back
        </motion.button>
      </div>

      {/* QR Code Scanner Modal */}
      <AnimatePresence>
        {showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQRScanner(false)}
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-emerald-50">
                <div className="flex items-center gap-3">
                  <Camera size={24} className="text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-800">
                    Scan Event QR Code
                  </h2>
                </div>
                <button
                   onClick={() => setShowQRScanner(false)}
                   className="p-2 rounded-full hover:bg-slate-100 transition-all duration-200 group"
                 >
                   <X size={24} className="text-slate-600 group-hover:animate-pulse group-hover:rotate-0" />
                </button>
              </div>

              {/* Camera Feed */}
              <div className="p-4 flex flex-col gap-4">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                  className="relative bg-black rounded-2xl overflow-hidden aspect-square flex items-center justify-center"
                >
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* QR Scanning Frame */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-48 h-48 border-2 border-emerald-400 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                    <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
                    <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
                    <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
                    <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </motion.div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-900 leading-relaxed">
                    Position the QR code within the frame to scan it. Make sure
                    the code is clearly visible and well-lit.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowQRScanner(false)}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-xl font-semibold transition-colors text-sm"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
