import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
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
import logoNormal from '@/assets/logo_normal.png';

interface Props {
  onNavigate: (view: any) => void;
  logoWhite?: boolean;
  onLogoChange?: (white: boolean) => void;
}

export function DjLogin({
  onNavigate,
  logoWhite: isLogoWhite = false,
  onLogoChange,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authAPI.login(email, password);
      const displayName = result.user?.displayName || 'DJ';

      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));

        let event;
        const events = await eventsAPI.listEvents();

        if (events && events.length > 0) {
          event = events[0];
        } else {
          event = await eventsAPI.createEvent(
            `${displayName}'s Party`,
            'Auto-created event',
            new Date().toISOString(),
          );
        }

        const eventId = event.id || event._id;

        localStorage.setItem(
          'currentEvent',
          JSON.stringify({
            accessCode: event.accessCode,
            eventId,
            ownerName: displayName,
          }),
        );

        localStorage.setItem(
          'currentParticipant',
          JSON.stringify({
            _id: result.user.id,
            nickname: displayName,
            eventId,
          }),
        );
      }

      toast.success(`Welcome back, ${displayName}!`);
      socket.initSocket(result.authToken);
      onNavigate('dj-dashboard');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
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
        onClick={() => onNavigate('role-selection')}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        Back
      </motion.button>

      {/* Main */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-5 py-16">
        <motion.form
          onSubmit={handleLogin}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-[400px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45),0_8px_20px_-8px_rgba(0,0,0,0.15)] p-7 sm:p-9"
        >
          {/* Brand lockup (logo PNG already contains the wordmark) */}
          <div className="flex items-center justify-center mb-8">
            <img
              src={logoNormal}
              alt="SyncRequest"
              className="h-28 w-auto object-contain select-none"
              draggable={false}
            />
          </div>

          {/* Headline */}
          <h1 className="text-[26px] leading-[1.15] font-semibold tracking-[-0.015em] text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-slate-500">
            Sign in to manage your events and requests.
          </p>

          {/* Inputs */}
          <div className="mt-7 space-y-4">
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
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
                Signing in…
              </>
            ) : (
              <>
                Sign in
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
              New to SyncRequest?{' '}
              <button
                type="button"
                onClick={() => onNavigate('dj-register')}
                className="font-medium text-slate-900 hover:underline underline-offset-2"
              >
                Create an account
              </button>
            </p>
          </div>
        </motion.form>
      </div>
    </div>
  );
}
