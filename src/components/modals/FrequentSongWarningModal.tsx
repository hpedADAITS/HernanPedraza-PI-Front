import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';
import { SLIDE_UP } from '@/constants/animations';

interface FrequentSongWarningModalProps {
  isOpen: boolean;
  songTitle: string;
  requestCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function FrequentSongWarningModal({
  isOpen,
  songTitle,
  requestCount,
  onConfirm,
  onCancel
}: FrequentSongWarningModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Modal */}
          <motion.div
            {...SLIDE_UP}
            transition={{ ...SLIDE_UP.transition, delay: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 flex items-center gap-3">
                <AlertCircle size={28} className="text-white flex-shrink-0" />
                <h2 className="text-xl font-semibold text-white">Popular Song</h2>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-slate-700">
                  <span className="font-semibold">"{songTitle}"</span> has been requested{' '}
                  <span className="font-bold" style={{ color: '#ef4444' }}>{requestCount} times</span> already.
                </p>
                <p className="text-sm text-slate-600">
                  This song is very popular! Would you still like to request it?
                </p>
              </div>

              {/* Actions */}
              <div className="bg-slate-50 p-6 flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 rounded-full bg-white hover:bg-slate-50 shadow-xl shadow-black/10 text-slate-800 font-light border border-slate-100 transition-colors"
                >
                  Choose Different
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  className="flex-1 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-900/20 text-white font-light border border-emerald-600 transition-colors"
                >
                  Request Anyway
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
