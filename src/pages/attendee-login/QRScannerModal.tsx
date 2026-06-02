import { m, AnimatePresence } from 'motion/react';
import { Camera, X } from 'lucide-react';
import { RefObject } from 'react';
import { t } from '@/i18n';

interface QRScannerModalProps {
  open: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  onClose: () => void;
}

export function QRScannerModal({
  open,
  videoRef,
  canvasRef,
  onClose,
}: QRScannerModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 99999 }}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4"
        >
          <m.div
            initial={{ scale: 0.97, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            onClick={(event) => event.stopPropagation()}
            className="bg-white rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] w-full max-w-sm overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Camera size={16} className="text-slate-700" />
                <h2 className="text-[14px] font-semibold tracking-tight text-slate-900">
                  {t('Scan event QR')}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('Close')}
                className="p-1.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X size={16} strokeWidth={2.25} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <div className="relative bg-slate-950 rounded-xl overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  aria-label={t('Live QR code scanner preview')}
                  className="w-full h-full object-cover"
                >
                  <track kind="captions" label={t('No audio captions available')} />
                </video>
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-7 left-7 w-7 h-7 border-t-2 border-l-2 border-white/90 rounded-tl-md" />
                  <div className="absolute top-7 right-7 w-7 h-7 border-t-2 border-r-2 border-white/90 rounded-tr-md" />
                  <div className="absolute bottom-7 left-7 w-7 h-7 border-b-2 border-l-2 border-white/90 rounded-bl-md" />
                  <div className="absolute bottom-7 right-7 w-7 h-7 border-b-2 border-r-2 border-white/90 rounded-br-md" />
                </div>
              </div>

              <p className="text-[12.5px] text-slate-500 leading-relaxed text-center">
                {t("Position the QR code within the frame. Make sure it's well-lit and clearly visible.")}
              </p>
            </div>

            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-900 text-[13.5px] font-medium transition-colors"
              >
                {t('Cancel')}
              </button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
