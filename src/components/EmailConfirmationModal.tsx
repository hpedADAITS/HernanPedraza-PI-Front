import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Check, Clock, AlertCircle, ArrowRight } from 'lucide-react';

interface EmailConfirmationModalProps {
  isOpen: boolean;
  email: string;
  displayName: string;
  onContinue: () => void;
  debugToken?: string;
}

export function EmailConfirmationModal({
  isOpen,
  email,
  displayName,
  onContinue,
  debugToken,
}: EmailConfirmationModalProps) {
  const [status, setStatus] = useState<'sending' | 'sent' | 'timeout'>('sending');

  useEffect(() => {
    if (isOpen) {
      setStatus('sending');
      /* Simulate email sending with a timeout */
      const timer = setTimeout(() => {
        setStatus('sent');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-200"
          >
            {/* Header Icon */}
            <div className="flex justify-center mb-6">
              {status === 'sending' ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="p-3 bg-blue-100 rounded-full"
                >
                  <Clock size={24} className="text-blue-600" />
                </motion.div>
              ) : status === 'sent' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="p-3 bg-green-100 rounded-full"
                >
                  <Check size={24} className="text-green-600" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="p-3 bg-yellow-100 rounded-full"
                >
                  <AlertCircle size={24} className="text-yellow-600" />
                </motion.div>
              )}
            </div>

            {/* Title & Description */}
            <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
              {status === 'sending'
                ? 'Sending Welcome Email'
                : status === 'sent'
                  ? 'Email Sent!'
                  : 'Email Delivery'}
            </h2>
            <p className="text-slate-600 text-center text-sm mb-6">
              {status === 'sending'
                ? `We're sending a welcome message to ${email}`
                : status === 'sent'
                  ? `Welcome email sent to ${email}! Check your inbox for important information.`
                  : 'We had trouble sending the email, but your account is ready to use.'}
            </p>

            {/* Email Display */}
            <motion.div
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
            </motion.div>

            {/* Info Box */}
             {status === 'sent' && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.4 }}
                 className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
               >
                 <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
                 {debugToken ? (
                   <div className="text-sm text-blue-800">
                     <p className="mb-3">🐛 Debug Mode: Verification Token</p>
                     <code className="block bg-white p-2 rounded border border-blue-300 break-all text-xs font-mono mb-2 cursor-pointer hover:bg-blue-100"
                       onClick={() => navigator.clipboard.writeText(debugToken)}>
                       {debugToken}
                     </code>
                     <p className="text-xs text-blue-700">Click to copy. Use with /verify-email?token=...</p>
                   </div>
                 ) : (
                   <ul className="text-sm text-blue-800 space-y-1">
                     <li>✓ Check your email inbox</li>
                     <li>✓ Click the "Verify Email & Continue" button in the email</li>
                     <li>✓ You'll be redirected back to complete event setup</li>
                   </ul>
                 )}
               </motion.div>
             )}

            {/* Loading Indicator */}
            {status === 'sending' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center gap-1 mb-6"
              >
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{
                      duration: 1.4,
                      delay: i * 0.2,
                      repeat: Infinity,
                    }}
                    className="w-2 h-2 bg-blue-600 rounded-full"
                  />
                ))}
              </motion.div>
            )}



            {/* Footer Message */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-xs text-slate-500 text-center mt-4"
            >
              {status === 'sending'
                ? 'This should only take a moment...'
                : `Hi ${displayName}, we'll see you in a moment!`}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
