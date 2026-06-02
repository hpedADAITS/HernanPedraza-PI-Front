import React from 'react';
import { m } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import logoWhite from '@/assets/logo_white.png';

interface LoginPageProps {
  children: React.ReactNode;
  background: string;
  formClassName?: string;
  onBack: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function LoginPage({
  children,
  background,
  formClassName = '',
  onBack,
  onSubmit,
}: LoginPageProps) {
  return (
    <div
      className="dark relative w-full min-h-screen overflow-x-hidden font-sans text-white"
      style={{ background }}
    >
      <m.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        whileHover={{ x: -2 }}
        whileTap={{ scale: 0.99 }}
        onClick={onBack}
        className="absolute top-6 left-6 md:top-8 md:left-8 z-50 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 backdrop-blur-md transition-colors"
      >
        <ArrowLeft size={14} strokeWidth={2.25} />
        Back
      </m.button>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center gap-6 px-5 py-10 sm:gap-8 sm:py-14">
        <m.div
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
        </m.div>

        <m.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className={`w-full max-w-[400px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45),0_8px_20px_-8px_rgba(0,0,0,0.15)] ${formClassName}`}
        >
          {children}
        </m.form>
      </div>
    </div>
  );
}
