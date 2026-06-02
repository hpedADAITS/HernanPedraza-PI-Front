import { useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { toast } from 'sonner';
import { t } from '@/i18n';

interface UseQrScannerOptions {
  enabled: boolean;
  onCode: (code: string) => void;
  onClose: () => void;
}

function decodeQRCode(data: Uint8ClampedArray, width: number, height: number) {
  const result = jsQR(data, width, height);
  if (!result) return null;

  const raw = result.data.trim();
  try {
    return new URL(raw).searchParams.get('code')?.toUpperCase() ?? null;
  } catch {
    return raw.length >= 4 ? raw.toUpperCase() : null;
  }
}

export function useQrScanner({ enabled, onCode, onClose }: UseQrScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    scanningRef.current = true;

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!video || !canvas || !context) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const code = decodeQRCode(
          context.getImageData(0, 0, canvas.width, canvas.height).data,
          canvas.width,
          canvas.height,
        );
        if (code) {
          onCode(code);
          toast.success(t('Event code scanned!'));
          return;
        }
      } catch {
        /* Keep scanning while the camera frame settles. */
      }

      if (scanningRef.current) requestAnimationFrame(scan);
    };

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = scan;
        }
      } catch {
        toast.error(t('Unable to access camera. Please check permissions.'));
        onClose();
      }
    };

    startCamera();

    return () => {
      scanningRef.current = false;
      const tracks = (videoRef.current?.srcObject as MediaStream | null)?.getTracks();
      tracks?.forEach((track) => track.stop());
    };
  }, [enabled, onCode, onClose]);

  return { videoRef, canvasRef };
}
