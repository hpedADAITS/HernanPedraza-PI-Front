import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Mail, Check, Clock } from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  email: string;
  displayName: string;
  debugToken?: string;
}

export function EmailConfirmationModal({
  isOpen,
  email,
  displayName,
  debugToken,
}: EmailConfirmationModalProps) {
  const [status, setStatus] = useState<'sending' | 'sent'>('sending');
  const debugVerificationUrl = debugToken
    ? `${window.location.origin}/?verifyEmailToken=${encodeURIComponent(debugToken)}`
    : '';

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => setStatus('sent'), 2000);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <m.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.98, opacity: 0 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-200"
          >
            <div className="flex justify-center mb-6">
              {status === 'sending' ? (
                <m.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="p-3 bg-blue-100 rounded-full"
                >
                  <Clock size={24} className="text-blue-600" />
                </m.div>
              ) : (
                <m.div
                  initial={{ scale: 0.98, opacity: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 32 }}
                  className="p-3 bg-green-100 rounded-full"
                >
                  <Check size={24} className="text-green-600" />
                </m.div>
              )}
            </div>

            <h2 className="text-2xl font-semibold text-slate-900 text-center mb-2">
              {status === 'sending' ? 'Sending Welcome Email' : 'Email Sent!'}
            </h2>
            <p className="text-slate-600 text-center text-sm mb-6">
              {status === 'sending'
                ? `We're sending a welcome message to ${email}`
                : `Welcome email sent to ${email}! Check your inbox for important information.`}
            </p>

            <m.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg p-4 border border-slate-200 mb-6"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Mail size={18} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-500 mb-1">Welcome Email</p>
                  <p className="text-sm font-medium text-slate-900 break-all">
                    {email}
                  </p>
                </div>
              </div>
            </m.div>

            {status === 'sent' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
              >
                <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                {debugToken ? (
                  <div className="text-sm text-blue-800">
                    <p className="mb-3">🐛 Debug Mode: Verification URL</p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            debugVerificationUrl,
                          );
                          alert('URL copied to clipboard!');
                        } catch (err) {
                          console.error('Failed to copy:', err);
                          alert('Failed to copy URL');
                        }
                      }}
                      className="block w-full bg-white p-2 rounded border border-blue-300 break-all text-left text-xs font-mono mb-2 cursor-pointer hover:bg-blue-100"
                    >
                      <code>{debugVerificationUrl}</code>
                    </button>
                    <p className="text-xs text-blue-700">Click to copy and paste in browser</p>
                  </div>
                ) : (
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Check your email inbox</li>
                    <li>✓ Click the "Verify Email & Continue" button in the email</li>
                    <li>✓ You'll be redirected back to complete event setup</li>
                  </ul>
                )}
              </m.div>
            )}

            {status === 'sending' && (
              <m.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-1 mb-6"
              >
                {['left', 'center', 'right'].map((dot, i) => (
                  <m.div
                    key={dot}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.4,
                      delay: i * 0.2,
                      repeat: Infinity,
                    }}
                    className="w-2 h-2 bg-blue-600 rounded-full"
                  />
                ))}
              </m.div>
            )}

            <m.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-slate-500 text-center mt-4"
            >
              {status === 'sending'
                ? 'This should only take a moment…'
                : `Hi ${displayName}, we'll see you in a moment!`}
            </m.p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
