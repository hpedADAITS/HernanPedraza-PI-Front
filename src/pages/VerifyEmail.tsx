import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

interface Props {
  onNavigate?: (view: string) => void;
}

export function VerifyEmail({ onNavigate }: Props) {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading',
  );
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyToken = async () => {
      /* Extract token from URL path: /verify-email/:token */
      const URLtoken = new URL(window.location.href).pathname.split('/').pop();

      if (!URLtoken) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await authAPI.verifyEmailToken(URLtoken);

        if (response.data?.user) {
          setStatus('success');
          setMessage(
            'Email verified! You may close this window.',
          );

          /* Update localStorage with verified status */
          const userData = {
            displayName: response.data.user.displayName,
            email: response.data.user.email,
            role: response.data.user.role,
            emailRegistered: true,
          };
          localStorage.setItem('user', JSON.stringify(userData));
          
          /* Signal verification complete to register page via custom event */
          window.dispatchEvent(new CustomEvent('emailVerified', { detail: userData }));
        }
      } catch (error) {
        setStatus('error');
        setMessage(
          error instanceof Error
            ? error.message
            : 'Failed to verify email. Link may have expired.',
        );
        toast.error('Email verification failed');
      }
    };

    verifyToken();
  }, [onNavigate]);

  return (
    <div
      className="w-full min-h-screen overflow-hidden font-sans text-white flex items-center justify-center px-5"
      style={{
        background:
          'radial-gradient(ellipse 90% 60% at 50% -10%, rgba(255,255,255,0.10) 0%, transparent 60%), linear-gradient(180deg, #1e3a8a 0%, #0c1e4a 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-md text-center"
      >
        {status === 'loading' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="flex justify-center mb-6"
            >
              <Loader size={48} className="text-blue-400" strokeWidth={2} />
            </motion.div>
            <h1 className="text-2xl font-semibold mb-3">Verifying Email</h1>
            <p className="text-slate-300">
              Please wait while we verify your email...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <CheckCircle
                size={64}
                className="text-green-400"
                strokeWidth={1.5}
              />
            </motion.div>
            <h1 className="text-2xl font-semibold mb-3 text-green-400">
              Email Verified!
            </h1>
            <p className="text-slate-300">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex justify-center mb-6"
            >
              <AlertCircle
                size={64}
                className="text-red-400"
                strokeWidth={1.5}
              />
            </motion.div>
            <h1 className="text-2xl font-semibold mb-3 text-red-400">
              Verification Failed
            </h1>
            <p className="text-slate-300 mb-6">{message}</p>
            <motion.button
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
              Back to Registration
            </motion.button>
          </>
        )}
      </motion.div>
    </div>
  );
}
