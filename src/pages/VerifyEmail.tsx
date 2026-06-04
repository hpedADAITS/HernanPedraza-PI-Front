import React, { useCallback, useEffect, useState } from 'react';
import { LazyMotion, domAnimation, m } from 'motion/react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';
import { writeStoredJson } from '@/utils/storage';
import { t } from '@/i18n';
import type { NavigateToView } from '@/types';
import { useEscapeKey } from '@/hooks/useEscapeKey';

function AutoCloseWindow({ delay = 500 }: { delay?: number }) {
  useEffect(() => {
    const closeTimer = window.setTimeout(() => window.close(), delay);
    return () => window.clearTimeout(closeTimer);
  }, [delay]);

  return null;
}

interface Props {
  onNavigate?: NavigateToView;
}

export function VerifyEmail({ onNavigate }: Props) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');

  const handleBack = useCallback(() => {
    if (onNavigate) {
      onNavigate('dj-register');
    } else {
      window.location.href = '/';
    }
  }, [onNavigate]);

  useEscapeKey(handleBack);

  useEffect(() => {
    const verifyToken = async () => {
      const url = new URL(window.location.href);
      const queryToken = url.searchParams.get('verifyEmailToken');
      const pathToken = url.pathname.split('/').pop() || '';
      const URLtoken = decodeURIComponent(queryToken || pathToken);

      if (!URLtoken) {
        setStatus('error');
        setMessage(t('No verification token provided'));
        return;
      }

      try {
        const response = await authAPI.verifyEmailToken(URLtoken);

        if (response.data?.user && response.data.user.emailRegistered) {
          setStatus('success');
          setMessage(t('Email verified! Closing this window…'));

          /* Update localStorage with verified status */
          const verifiedUser = response.data.user;
          const userData = {
            id: verifiedUser.id || verifiedUser._id,
            displayName: verifiedUser.displayName,
            email: verifiedUser.email,
            role: verifiedUser.role,
            emailRegistered: true,
          };
          writeStoredJson('user', userData);
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : t('Failed to verify email. Link may have expired.'),
        );
        toast.error(t('Email verification failed'));
      }
    };

    verifyToken();
  }, []);

  return (
    <div
      className="w-full min-h-screen overflow-hidden font-sans text-white flex items-center justify-center px-5"
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #1e3a8a 0%, #0c1e4a 100%)',
      }}
    >
      <LazyMotion features={domAnimation}>
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="w-full max-w-md text-center"
        >
        {status === 'loading' && (
          <>
            <m.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="flex justify-center mb-6"
            >
              <Loader size={48} className="text-blue-400" strokeWidth={2} />
            </m.div>
            <h1 className="text-2xl font-semibold mb-3">{t('Verifying Email')}</h1>
            <p className="text-slate-300">
              {t('Please wait while we verify your email…')}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <AutoCloseWindow />
            <m.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 32 }}
              className="flex justify-center mb-6"
            >
              <CheckCircle
                size={64}
                className="text-green-400"
                strokeWidth={1.5}
              />
            </m.div>
            <h1 className="text-2xl font-semibold mb-3 text-green-400">
              {t('Email Verified!')}
            </h1>
            <p className="text-slate-300">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <m.div
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 260, damping: 32 }}
              className="flex justify-center mb-6"
            >
              <AlertCircle
                size={64}
                className="text-red-400"
                strokeWidth={1.5}
              />
            </m.div>
            <h1 className="text-2xl font-semibold mb-3 text-red-400">
              {t('Verification Failed')}
            </h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <m.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (onNavigate) {
                  onNavigate('dj-register');
                } else {
                  window.location.href = '/';
                }
              }}
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              {t('Back to Registration')}
            </m.button>
          </>
        )}
        </m.div>
      </LazyMotion>
    </div>
  );
}
