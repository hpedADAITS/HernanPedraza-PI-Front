import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import { X, Copy, Download, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { eventsAPI } from '@/services/api/events';

interface QRCodeModalProps {
  isOpen: boolean;
  accessCode: string;
  onClose: () => void;
  isDj?: boolean;
  eventId?: string;
  onAccessCodeChange?: (newCode: string) => void;
}

export function QRCodeModal({
  isOpen,
  accessCode,
  onClose,
  isDj = false,
  eventId,
  onAccessCodeChange,
}: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleRegenerate = async () => {
    if (!eventId) {
      toast.error('Event ID missing');
      return;
    }
    setRegenerating(true);
    try {
      const event = await eventsAPI.regenerateAccessCode(eventId);
      onAccessCodeChange?.(event.accessCode);
      toast.success('Access code regenerated');
      setShowConfirm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to regenerate code');
    } finally {
      setRegenerating(false);
    }
  };

  useEffect(() => {
    if (!accessCode) {
      setError('Access code not available');
    } else {
      setError('');
    }
  }, [accessCode]);

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(accessCode);
    toast.success('Access code copied!');
  };

  const handleDownloadQR = () => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = url;
      link.download = `event-qr-${accessCode}.png`;
      link.click();
      toast.success('QR code downloaded!');
    }
  };

  return (
    <TooltipProvider>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: 99999 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-80 h-auto overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="sticky top-0 bg-white flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-800">
                  Event QR Code
                </h2>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                >
                  <X size={24} className="text-slate-600" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col gap-3">
                 {error ? (
                   <div className="flex justify-center items-center p-4 bg-red-50 rounded-2xl">
                     <p className="text-sm text-red-700">{error}</p>
                   </div>
                 ) : (
                   <>
                     {/* QR Code */}
                     <motion.div
                       initial={{ scale: 0.9, opacity: 0 }}
                       animate={{ scale: 1, opacity: 1 }}
                       className="flex justify-center items-center p-2 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl"
                       ref={qrRef}
                     >
                       <QRCode
                         value={accessCode}
                         size={128}
                         level="H"
                         includeMargin={true}
                         className="rounded-lg"
                       />
                     </motion.div>
                   </>
                 )}

                {/* Access Code Display */}
                <div className="w-full">
                  <p className="text-xs text-slate-600 text-center mb-2 font-medium uppercase">
                    Access Code
                  </p>
                  <div className="bg-slate-100 rounded-xl p-3 flex items-center justify-between gap-2">
                    <code className="text-base font-bold text-slate-800 tracking-wider flex-1">
                      {accessCode}
                    </code>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopyCode}
                          className="p-2 hover:bg-slate-200 rounded-lg transition-colors flex-shrink-0"
                        >
                          <Copy size={18} className="text-slate-600" />
                        </motion.button>
                      </TooltipTrigger>
                      <TooltipContent>Copy code</TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-900 leading-relaxed">
                    Share this QR code or access code with attendees to join.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 p-4 border-t border-slate-200 bg-slate-50">
                {isDj && (
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowConfirm(true)}
                    disabled={regenerating}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <RefreshCw size={18} />
                    Regenerate Access Code
                  </motion.button>
                )}
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleDownloadQR}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Download size={18} />
                    Download
                  </motion.button>
                  <motion.button
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-800 py-2 rounded-xl font-semibold transition-colors text-sm"
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate access code?</AlertDialogTitle>
            <AlertDialogDescription>
              This is a dangerous action. The current access code will stop
              working immediately. All connected attendees will be notified of
              the new code, and anyone trying to join with the old code will
              fail. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={regenerating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleRegenerate();
              }}
              disabled={regenerating}
              className="bg-red-600 hover:bg-red-700"
            >
              {regenerating ? 'Regenerating...' : 'Yes, regenerate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
