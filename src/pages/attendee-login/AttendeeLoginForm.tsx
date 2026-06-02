import { m, AnimatePresence } from 'motion/react';
import { User, Ticket, ArrowRight, QrCode, Lock } from 'lucide-react';
import { AttendeeLoginState } from './useAttendeeLoginController';

interface AttendeeLoginFormProps {
  state: AttendeeLoginState;
  loading: boolean;
  isAccessCodeVerified: boolean;
  onNicknameChange: (value: string) => void;
  onEventCodeChange: (value: string) => void;
  onNicknamePasswordChange: (value: string) => void;
  onOpenScanner: () => void;
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <m.button
      type="submit"
      whileTap={{ scale: loading ? 1 : 0.99 }}
      disabled={loading}
      className="group/btn w-full h-11 rounded-lg bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-[14.5px] font-medium shadow-[0_1px_0_0_rgba(255,255,255,0.06)_inset,0_8px_20px_-10px_rgba(15,23,42,0.7)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          {label === 'Continue' ? 'Checking...' : 'Joining...'}
        </>
      ) : (
        <>
          {label}
          <ArrowRight
            size={15}
            strokeWidth={2.5}
            className="transition-transform group-hover/btn:translate-x-0.5"
          />
        </>
      )}
    </m.button>
  );
}

export function AttendeeLoginForm({
  state,
  loading,
  isAccessCodeVerified,
  onNicknameChange,
  onEventCodeChange,
  onNicknamePasswordChange,
  onOpenScanner,
}: AttendeeLoginFormProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      {!isAccessCodeVerified ? (
        <m.div
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
                  onChange={(event) => onNicknameChange(event.target.value)}
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
                  onChange={(event) => onEventCodeChange(event.target.value)}
                  required
                  className="flex-1 bg-transparent px-3.5 text-[14.5px] tracking-[0.08em] font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal outline-none"
                />
                <button
                  type="button"
                  onClick={onOpenScanner}
                  aria-label="Scan QR code"
                  title="Scan QR code"
                  className="flex items-center justify-center w-11 text-slate-400 hover:text-slate-700 border-l border-slate-200 transition-colors"
                >
                  <QrCode size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <SubmitButton loading={loading} label="Continue" />
          </div>
        </m.div>
      ) : (
        <m.div
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
                onChange={(event) => onNicknamePasswordChange(event.target.value)}
                autoComplete="current-password"
                className="flex-1 bg-transparent px-3.5 text-[14.5px] text-slate-900 placeholder:text-slate-400 outline-none"
              />
            </div>
          </div>

          <SubmitButton loading={loading} label="Join event" />
        </m.div>
      )}
    </AnimatePresence>
  );
}
