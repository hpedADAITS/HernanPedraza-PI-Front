import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Lock,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { authAPI, eventsAPI } from '@/services/api';
import * as socket from '@/services/socket';
import { useDarkMode } from '@/hooks/useDarkMode';
import { EventIdSetupModal } from '@/components/EventIdSetupModal';
import logoNormal from '@/assets/logo_normal.png';
import logoWhite from '@/assets/logo_white.png';

interface Props {
  onNavigate: (view: any) => void;
  logoWhite?: boolean;
  onLogoChange?: (white: boolean) => void;
}

export function DjRegister({
  onNavigate,
  logoWhite = false,
  onLogoChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDarkMode] = useDarkMode();
  const [showEventIdModal, setShowEventIdModal] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);

  const validateForm = (): boolean => {
    if (
      !email.trim() ||
      !password.trim() ||
      !confirmPassword.trim() ||
      !displayName.trim()
    ) {
      toast.error('All fields are required');
      return false;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return false;
    }

    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await authAPI.register(
        email,
        password,
        displayName,
        'DJ',
      );

      if (!result || !result.token) {
        throw new Error('Failed to create account');
      }

      localStorage.setItem(
        'user',
        JSON.stringify({
          displayName,
          email,
          role: 'DJ',
        }),
      );

      // Event ID Modal Dialog
      setRegistrationData({
        token: result.authToken || result.token,
        userId: result.user?._id || result.user?.id,
      });
      setShowEventIdModal(true);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Registration failed',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEventIdSetup = async (eventId: string) => {
    try {
      const event = await eventsAPI.createEvent(
        `${displayName}'s Event`,
        'Welcome to your event!',
        new Date().toISOString(),
        eventId,
      );

      const eventMongoDB = event._id || event.id;
      const eventCode = event.accessCode || event.access_code;

      localStorage.setItem(
        'currentEvent',
        JSON.stringify({
          eventCode,
          eventId: eventMongoDB,
          eventIdCode: eventId,
          ownerName: displayName,
        }),
      );

      localStorage.setItem(
        'currentParticipant',
        JSON.stringify({
          _id: registrationData.userId,
          nickname: displayName,
          eventId: eventMongoDB,
        }),
      );

      toast.success(`Welcome, ${displayName}! Your event is ready to go.`);
      socket.initSocket(registrationData.token);
      setShowEventIdModal(false);
      onNavigate('dj-dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to create event',
      );
    }
  };

  return (
    <div
      className="dark relative w-full min-h-screen overflow-hidden font-sans text-white"
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #1e3a8a 0%, #0c1e4a 100%)',
      }}
    >
      {/* Top-left back chip */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => onNavigate('dj-login')}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        Back
      </motion.button>

      {/* Main */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-16">
        <motion.form
          onSubmit={handleRegister}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[400px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45),0_8px_20px_-8px_rgba(0,0,0,0.15)] p-7 sm:p-9"
        >
          {/* Brand lockup (logo PNG already contains the wordmark) */}
          <div className="flex items-center justify-center mb-8">
            <img
              src={isDarkMode ? logoWhite : logoNormal}
              alt="SyncRequest"
              className="h-28 w-auto object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Headline */}
          <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.015em] text-slate-900">
            Create your account
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
            Set up your DJ profile to start hosting events.
          </p>

          {/* Inputs */}
          <div className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="dj-name"
                className="block text-[12px] font-medium text-slate-700 mb-1.5"
              >
                DJ name
              </label>
              <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.22)] transition-shadow duration-150">
                <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                  <User size={16} strokeWidth={2} />
                </div>
                <input
                  id="dj-name"
                  type="text"
                  placeholder="Your stage name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  autoComplete="nickname"
                  className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dj-email"
                className="block text-[12px] font-medium text-slate-700 mb-1.5"
              >
                Email
              </label>
              <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.22)] transition-shadow duration-150">
                <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                  <Mail size={16} strokeWidth={2} />
                </div>
                <input
                  id="dj-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="dj-password"
                className="block text-[12px] font-medium text-slate-700 mb-1.5"
              >
                Password
              </label>
              <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.22)] transition-shadow duration-150">
                <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                  <Lock size={16} strokeWidth={2} />
                </div>
                <input
                  id="dj-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="flex items-center justify-center w-11 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label
                htmlFor="dj-confirm-password"
                className="block text-[12px] font-medium text-slate-700 mb-1.5"
              >
                Confirm password
              </label>
              <div className="group relative flex items-stretch h-11 rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-inset focus-within:ring-slate-900 focus-within:shadow-[0_0_0_4px_rgba(37,99,235,0.22)] transition-shadow duration-150">
                <div className="flex items-center justify-center w-11 text-slate-400 group-focus-within:text-slate-900 border-r border-slate-200 transition-colors">
                  <Lock size={16} strokeWidth={2} />
                </div>
                <input
                  id="dj-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={
                    showConfirmPassword ? 'Hide password' : 'Show password'
                  }
                  className="flex items-center justify-center w-11 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} strokeWidth={2} />
                  ) : (
                    <Eye size={16} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            whileTap={{ scale: loading ? 1 : 0.99 }}
            disabled={loading}
            className="group/btn mt-6 w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-[14.5px] font-medium shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_-10px_rgba(15,23,42,0.7)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Creating account…
              </>
            ) : (
              <>
                Create account
                <ArrowRight
                  size={15}
                  strokeWidth={2.5}
                  className="transition-transform group-hover/btn:translate-x-0.5"
                />
              </>
            )}
          </motion.button>

          {/* Hairline divider */}
          <div className="mt-7 pt-5 border-t border-slate-100">
            <p className="text-center text-[13px] text-slate-500">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => onNavigate('dj-login')}
                className="font-medium text-slate-900 hover:underline underline-offset-2"
              >
                Sign in
              </button>
            </p>
          </div>
        </motion.form>
      </div>

      {/* Event ID Setup Modal */}
      <EventIdSetupModal
        isOpen={showEventIdModal}
        onConfirm={handleEventIdSetup}
        displayName={displayName}
      />
    </div>
  );
}
