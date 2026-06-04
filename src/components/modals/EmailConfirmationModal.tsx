import React, { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { Mail, Check, Clock, Loader, Copy, ExternalLink } from 'lucide-react';
import { t } from '@/i18n';
import { authAPI } from '@/services/api';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  email: string;
  displayName: string;
  debugToken?: string;
  onVerified?: () => void;
}

export function EmailConfirmationModal({
  isOpen,
  email,
  displayName,
  debugToken,
  onVerified,
}: EmailConfirmationModalProps) {
  const [status, setStatus] = useState<'sending' | 'sent' | 'verifying'>('sending');
  const [verifyError, setVerifyError] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const debugVerificationUrl = debugToken
    ? `${window.location.origin}/?verifyEmailToken=${encodeURIComponent(debugToken)}`
    : '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
              {status === 'sending' ? t('Sending Welcome Email') : t('Email Sent!')}
            </h2>
            <p className="text-slate-600 text-center text-sm mb-6">
              {status === 'sending'
                ? t("We're sending a welcome message to {email}", { email })
                : t('Welcome email sent to {email}! Check your inbox for important information.', { email })}
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
                  <p className="text-xs text-slate-500 mb-1">{t('Welcome Email')}</p>
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
                <h3 className="font-semibold text-blue-900 mb-2">{t("What's Next?")}</h3>
                {(debugToken || import.meta.env.DEV) ? (
                  <div className="text-sm text-blue-800 space-y-3">
                    <p className="font-medium">{import.meta.env.DEV ? t('Dev Mode: Click the link below to verify') : t('Debug Mode: Click the link below to verify')}</p>
                    
                    {debugToken && debugVerificationUrl ? (
                      <>
                        {/* Verification URL Card */}
                        <div className="bg-white rounded-lg p-3 border border-blue-200">
                          <p className="text-xs text-slate-500 mb-2">{t('Verification Link')}</p>
                          <div className="flex items-center gap-2">
                            <a
                              href={debugVerificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-xs text-blue-600 hover:text-blue-800 hover:underline break-all font-mono bg-blue-50 px-2 py-1 rounded"
                            >
                              {debugVerificationUrl}
                            </a>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(debugVerificationUrl)}
                              className="flex-shrink-0 p-1.5 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                              title={t('Copy link')}
                            >
                              {copied ? (
                                <Check size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} className="text-blue-600" />
                              )}
                            </button>
                            <a
                              href={debugVerificationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-1.5 bg-blue-100 hover:bg-blue-200 rounded-md transition-colors"
                              title={t('Open link')}
                            >
                              <ExternalLink size={14} className="text-blue-600" />
                            </a>
                          </div>
                        </div>

                        {/* Direct Verify Button */}
                        <button
                          type="button"
                          disabled={status === 'verifying'}
                          onClick={async () => {
                            setStatus('verifying');
                            setVerifyError('');
                            try {
                              await authAPI.verifyEmailToken(debugToken);
                              if (onVerified) {
                                onVerified();
                              }
                            } catch (err) {
                              setVerifyError(err instanceof Error ? err.message : t('Verification failed'));
                              setStatus('sent');
                            }
                          }}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                          {status === 'verifying' ? (
                            <>
                              <Loader size={18} className="animate-spin" />
                              {t('Verifying...')}
                            </>
                          ) : (
                            <>
                              <Check size={18} />
                              {t('Verify Email')}
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      <p className="text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-200">
                        {t('No debug token available. Set DEBUG_EMAIL=true or DEBUG_MODE=true in backend .env')}
                      </p>
                    )}
                    {verifyError && (
                      <p className="mt-2 text-red-600 text-xs">{verifyError}</p>
                    )}
                  </div>
                ) : (
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>{t('Check your email inbox')}</li>
                    <li>{t('Click the "Verify Email & Continue" button in the email')}</li>
                    <li>{t("You'll be redirected back to complete event setup")}</li>
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
                ? t('This should only take a moment…')
                : t("Hi {name}, we'll see you in a moment!", { name: displayName })}
            </m.p>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
