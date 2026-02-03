import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'qrcode.react';
import { X, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

interface QRCodeModalProps {
  isOpen: boolean;
  accessCode: string;
  onClose: () => void;
}

export function QRCodeModal({ isOpen, accessCode, onClose }: QRCodeModalProps) {
  const qrRef = useRef<HTMLDivElement>(null);

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
              <h2 className="text-lg font-bold text-slate-800">Event QR Code</h2>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
              >
                <X size={24} className="text-slate-600" />
              </motion.button>
            </div>

            {/* Content */}
            <div className="p-4 flex flex-col gap-3">
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

              {/* Access Code Display */}
              <div className="w-full">
                <p className="text-xs text-slate-600 text-center mb-2 font-medium uppercase">Access Code</p>
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
            <div className="flex gap-2 p-4 border-t border-slate-200 bg-slate-50">
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
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </TooltipProvider>
  );
}
