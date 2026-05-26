import React, { useState, useRef, useEffect, useReducer } from 'react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';
import { User, Ticket, ArrowLeft, ArrowRight, QrCode, X, Camera, Lock,  } from 'lucide-react';
import { toast } from 'sonner';
import { participantsAPI, eventsAPI, authAPI } from '@/services/api';
import * as socket from '@/services/socket';
import logoWhite from '@/assets/logo_white.png';
import { writeStoredJson } from '@/utils/storage';
import { validateNickname } from '@/utils/validation';
import type { NavigateToView } from '@/types';

interface Props {
  onNavigate: NavigateToView;
  logoWhite?: boolean;
  onLogoChange?: (white: boolean) => void;
}

interface AttendeeLoginState {
  eventCode: string;
  nickname: string;
  nicknamePassword: string;
  verifiedEvent: any;
  showQRScanner: boolean;
}

type AttendeeLoginAction =
  | { type: 'set_event_code'; value: string }
  | { type: 'set_nickname'; value: string }
  | { type: 'set_nickname_password'; value: string }
  | { type: 'set_verified_event'; value: any }
  | { type: 'set_show_qr_scanner'; value: boolean };

const INITIAL_STATE: AttendeeLoginState = {
  eventCode: '',
  nickname: '',
  nicknamePassword: '',
  verifiedEvent: null,
  showQRScanner: false,
};

function attendeeLoginReducer(
  state: AttendeeLoginState,
  action: AttendeeLoginAction,
): AttendeeLoginState {
  switch (action.type) {
    case 'set_event_code':
      return { ...state, eventCode: action.value };
    case 'set_nickname':
      return { ...state, nickname: action.value };
    case 'set_nickname_password':
      return { ...state, nicknamePassword: action.value };
    case 'set_verified_event':
      return { ...state, verifiedEvent: action.value };
    case 'set_show_qr_scanner':
      return { ...state, showQRScanner: action.value };
    default:
      return state;
  }
}

export function AttendeeLogin({
  onNavigate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [state, dispatch] = useReducer(attendeeLoginReducer, INITIAL_STATE);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(true);
  const isAccessCodeVerified = Boolean(state.verifiedEvent);

  const ensureNicknameAllowed = async () => {
    const result = validateNickname(state.nickname.trim());

    if (!result.valid) {
      throw new Error(result.message || 'Invalid nickname');
    }

    await participantsAPI.validateNickname(state.nickname.trim());
  };

  useEffect(() => {
    if (!state.showQRScanner) return;
    scanningRef.current = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            scanQRCode();
          };
        }
      } catch (error) {
        toast.error('Unable to access camera. Please check permissions.');
        dispatch({ type: 'set_show_qr_scanner', value: false });
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
  }, [state.showQRScanner]);

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
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
        dispatch({ type: 'set_event_code', value: code.toUpperCase() });
        dispatch({ type: 'set_show_qr_scanner', value: false });
        toast.success('Event code scanned!');
        return;
      }
    } catch (error) {
      /* Continue scanning if decoding fails */
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
      const code = url.searchParams.get('code');
      if (code) return code.toUpperCase();
    } catch {
      /* Not a URL, treat as raw code */
    }
    return raw.length >= 4 ? raw.toUpperCase() : null;
  };

  const handleEventCodeChange = (value: string) => {
    dispatch({ type: 'set_event_code', value: value.toUpperCase() });
    dispatch({ type: 'set_verified_event', value: null });
  };

  const handleValidateAccessCode = async () => {
    setLoading(true);
    try {
      if (!state.eventCode.trim() || !state.nickname.trim()) {
        throw new Error('Please enter both event code and nickname');
      }

      await ensureNicknameAllowed();

      let event;
      try {
        event = await eventsAPI.getEventByAccessCode(state.eventCode);
      } catch (err: any) {
        throw new Error(
          'Invalid access code. Please check the code and try again.',
        );
      }

      if (!event) {
        throw new Error('Invalid access code. Please check the code and try again, or ask the DJ to share a new QR code.');
      }

      dispatch({ type: 'set_verified_event', value: event });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to verify access code',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleJoinEvent = async () => {
    setLoading(true);
    try {
      const event = state.verifiedEvent;
      if (!event) {
        throw new Error('Please enter a valid access code first');
      }

      await ensureNicknameAllowed();

      const tempEmail = `attendee_${Date.now()}@syncrekuest.local`;
      const tempPassword = Math.random().toString(36).substring(2, 15);

      const authResult = await authAPI.register(
        tempEmail,
        tempPassword,
        state.nickname,
        'ATTENDEE',
      );

      if (!authResult || !authResult.token) {
        throw new Error('Failed to create account');
      }

      const participant = await participantsAPI.joinEvent(
        event._id || event.id,
        state.nickname,
        null,
        state.nicknamePassword || undefined,
      );

      if (!participant) {
        throw new Error('Failed to join event');
      }

      const ownerName = event.ownerId?.displayName || event.ownerName || 'En evento de DJ:';
      const ownerProfilePicture = event.ownerId?.profilePicture || null;
      const sessionData = {
        nickname: state.nickname,
        eventCode: state.eventCode,
        eventId: event._id || event.id,
        participantId: participant._id || participant.id,
        joinedAt: new Date().toISOString(),
        ownerName,
        ownerProfilePicture,
      };
      writeStoredJson('user', { displayName: state.nickname });
      writeStoredJson('currentEvent', sessionData);
      writeStoredJson('currentParticipant', {
        _id: participant._id || participant.id,
        nickname: state.nickname,
        eventId: event._id || event.id,
        profilePicture: participant.profilePicture || null,
        passwordProtected: Boolean(participant.passwordProtected),
      });

      toast.success('Account created and joined event successfully!');
      socket.initSocket(authResult.authToken || authResult.token);
      onNavigate('attendee-dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to join event',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAccessCodeVerified) {
      await handleJoinEvent();
    } else {
      await handleValidateAccessCode();
    }
  };

  return (
    <div
      className="dark relative w-full min-h-screen overflow-x-hidden font-sans text-white"
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #065f46 0%, #052e22 100%)',
      }}
    >
      {/* Top-left back chip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onNavigate('role-selection')}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        Back
      </motion.button>

      {/* Main */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-6 px-5 py-10 sm:gap-8 sm:py-14">
        <motion.div
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
          className="drop-shadow-xl"
        >
          <img
            src={logoWhite}
            alt="SyncRequest"
            className="h-28 w-auto max-w-[86vw] object-contain sm:h-32 md:h-40 lg:h-44"
          />
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[400px] overflow-hidden bg-white rounded-2xl border border-slate-200/80 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45),0_8px_20px_-8px_rgba(0,0,0,0.15)] p-7 sm:p-9"
        >
          <AnimatePresence mode="wait" initial={false}>
            {!isAccessCodeVerified ? (
              <motion.div
                key="access-code-step"
                initial={{ x: -36, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -48, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
              >
                <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.015em] text-slate-900">
                  Join the event
                </h1>
                <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
                  Enter the event code to start sending song requests.
                </p>

                <div className="mt-7 space-y-6">
                  <div>
                    <label
                      htmlFor="att-nickname"
                      className="block text-[12px] font-medium text-slate-700 mb-1.5"
                    >
                      Nickname
                    </label>
                    <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(5,150,105,0.22)] transition-shadow duration-150">
                      <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                        <User size={16} strokeWidth={2} />
                      </div>
                      <input
                        id="att-nickname"
                        type="text"
                        aria-label="Nickname"
                        placeholder="Pick a name to display"
                        value={state.nickname}
                        onChange={(e) => {
                          dispatch({
                            type: 'set_nickname',
                            value: e.target.value,
                          });
                          dispatch({ type: 'set_verified_event', value: null });
                        }}
                        required
                        className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="att-code"
                      className="block text-[12px] font-medium text-slate-700 mb-1.5"
                    >
                      Access Code
                    </label>
                    <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(5,150,105,0.22)] transition-shadow duration-150">
                      <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                        <Ticket size={16} strokeWidth={2} />
                      </div>
                      <input
                        id="att-code"
                        type="text"
                        aria-label="Access code"
                        placeholder="Scan QR or enter code"
                        value={state.eventCode}
                        onChange={(e) => handleEventCodeChange(e.target.value)}
                        required
                        className="flex-1 bg-transparent px-3.5 text-[14.5px] tracking-[0.08em] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          dispatch({ type: 'set_show_qr_scanner', value: true })
                        }
                        aria-label="Scan QR code"
                        title="Scan QR code"
                        className="flex items-center justify-center w-11 text-slate-400 hover:text-slate-700 border-l border-slate-200 transition-colors"
                      >
                        <QrCode size={16} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  disabled={loading}
                  className="group/btn mt-6 w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-[14.5px] font-medium shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_-10px_rgba(15,23,42,0.7)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Checking…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight
                        size={15}
                        strokeWidth={2.5}
                        className="transition-transform group-hover/btn:translate-x-0.5"
                      />
                    </>
                  )}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="password-step"
                initial={{ x: 48, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 48, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                className="space-y-6"
              >
                <div>
                  <label
                    htmlFor="att-password"
                    className="block text-[12px] font-medium text-slate-700 mb-1.5"
                  >
                    Name password
                  </label>
                  <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(5,150,105,0.22)] transition-shadow duration-150">
                    <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                      <Lock size={16} strokeWidth={2} />
                    </div>
                    <input
                      id="att-password"
                      type="password"
                      aria-label="Name password"
                      placeholder="Only if you protected this name"
                      value={state.nicknamePassword}
                      onChange={(e) =>
                        dispatch({
                          type: 'set_nickname_password',
                          value: e.target.value,
                        })
                      }
                      autoComplete="current-password"
                      className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
                    />
                  </div>
                </div>

                <motion.button
                  type="submit"
                  whileTap={{ scale: loading ? 1 : 0.99 }}
                  disabled={loading}
                  className="group/btn w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-[14.5px] font-medium shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_-10px_rgba(15,23,42,0.7)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Joining…
                    </>
                  ) : (
                    <>
                      Join event
                      <ArrowRight
                        size={15}
                        strokeWidth={2.5}
                        className="transition-transform group-hover/btn:translate-x-0.5"
                      />
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>

      {/* QR Code Scanner Modal */}
      <AnimatePresence>
        {state.showQRScanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() =>
              dispatch({ type: 'set_show_qr_scanner', value: false })
            }
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.97, opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Camera size={16} className="text-slate-700" />
                  <h2 className="text-[14px] font-semibold tracking-tight text-slate-900">
                    Scan event QR
                  </h2>
                </div>
                <button
                  type="button"
                onClick={() =>
                  dispatch({ type: 'set_show_qr_scanner', value: false })
                }
                  aria-label="Close"
                  className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X size={16} strokeWidth={2.25} />
                </button>
              </div>

              {/* Camera Feed */}
              <div className="p-5 flex flex-col gap-4">
                <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-square">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    aria-label="Live QR code scanner preview"
                    className="w-full h-full object-cover"
                  >
                    <track kind="captions" label="No audio captions available" />
                  </video>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Frame */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-7 left-7 w-7 h-7 border-t-2 border-l-2 border-white/90 rounded-tl-md" />
                    <div className="absolute top-7 right-7 w-7 h-7 border-t-2 border-r-2 border-white/90 rounded-tr-md" />
                    <div className="absolute bottom-7 left-7 w-7 h-7 border-b-2 border-l-2 border-white/90 rounded-bl-md" />
                    <div className="absolute bottom-7 right-7 w-7 h-7 border-b-2 border-r-2 border-white/90 rounded-br-md" />
                  </div>
                </div>

                <p className="text-[12.5px] text-slate-500 leading-relaxed text-center">
                  Position the QR code within the frame. Make sure it's well-lit
                  and clearly visible.
                </p>
              </div>

              <div className="px-5 pb-5">
                <button
                  type="button"
                  onClick={() =>
                    dispatch({ type: 'set_show_qr_scanner', value: false })
                  }
                  className="w-full h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-[13.5px] font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
