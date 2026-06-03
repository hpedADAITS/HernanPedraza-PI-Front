import React from 'react';
import { CoverCubeTextureMessageSource, CoverCubeWorkerMessage, SetCoverCubeTextureOptions } from './coverCubeWorkerMessages';

const spillScale = 1.03;
const workerUrl = new URL('./CoverCube.worker.ts', import.meta.url);

interface CoverCubeProps {
  albumArt?: string;
  accentColor: string;
  className?: string;
}

declare global {
  interface Window {
    setCoverCubeTexture?: (
      source: string | HTMLCanvasElement | ImageBitmap | null,
      options?: SetCoverCubeTextureOptions,
    ) => void;
    resetCoverCubeTexture?: () => void;
  }
}

function getCoverCoordinates(
  cover: HTMLDivElement,
  event: PointerEvent | React.PointerEvent<HTMLDivElement>,
) {
  const rect = cover.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

const canUseCoverCubeWorker = () =>
  typeof Worker !== 'undefined' &&
  typeof HTMLCanvasElement !== 'undefined' &&
  'transferControlToOffscreen' in HTMLCanvasElement.prototype;

export function CoverCube({
  albumArt,
  accentColor,
  className,
}: CoverCubeProps) {
  const coverRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const workerRef = React.useRef<Worker | null>(null);
  const requestIdRef = React.useRef(0);
  const pointerDraggingRef = React.useRef(false);
  const [workerFailed, setWorkerFailed] = React.useState(false);
  const renderFailed = !canUseCoverCubeWorker() || workerFailed;

  const postWorkerMessage = React.useCallback((message: CoverCubeWorkerMessage) => {
    workerRef.current?.postMessage(message);
  }, []);

  const syncCanvasLayout = React.useCallback(() => {
    const cover = coverRef.current;
    const canvas = canvasRef.current;

    if (!cover || !canvas) {
      return null;
    }

    const width = cover.clientWidth;
    const height = cover.clientHeight;
    const spillWidth = width * spillScale;
    const spillHeight = height * spillScale;

    canvas.style.width = `${spillWidth}px`;
    canvas.style.height = `${spillHeight}px`;
    canvas.style.left = `${(width - spillWidth) / 2}px`;
    canvas.style.top = `${(height - spillHeight) / 2}px`;

    return { width, height };
  }, []);

  React.useEffect(() => {
    const cover = coverRef.current;
    const canvas = canvasRef.current;

    if (!cover || !canvas) {
      return;
    }

    if (!canUseCoverCubeWorker()) return;

    const size = syncCanvasLayout();

    if (!size) {
      return;
    }

    const worker = new Worker(workerUrl, { type: 'module' });
    workerRef.current = worker;

    const fail = () => setWorkerFailed(true);
    worker.addEventListener('error', fail);
    worker.addEventListener('messageerror', fail);

    const offscreen = canvas.transferControlToOffscreen();
    worker.postMessage(
      {
        type: 'init',
        canvas: offscreen,
        width: size.width,
        height: size.height,
        devicePixelRatio: window.devicePixelRatio,
        spillScale,
        accentColor,
      } satisfies CoverCubeWorkerMessage,
      [offscreen],
    );

    const resizeObserver = new ResizeObserver(() => {
      const nextSize = syncCanvasLayout();

      if (!nextSize) {
        return;
      }

      worker.postMessage({
        type: 'resize',
        width: nextSize.width,
        height: nextSize.height,
        devicePixelRatio: window.devicePixelRatio,
        spillScale,
      } satisfies CoverCubeWorkerMessage);
    });

    resizeObserver.observe(cover);

    return () => {
      resizeObserver.disconnect();
      worker.removeEventListener('error', fail);
      worker.removeEventListener('messageerror', fail);
      worker.postMessage({ type: 'destroy' } satisfies CoverCubeWorkerMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, [accentColor, syncCanvasLayout]);

  React.useEffect(() => {
    postWorkerMessage({
      type: 'setAccentColor',
      accentColor,
    });
  }, [accentColor, postWorkerMessage]);

  React.useEffect(() => {
    const sendTexture = async (
      source: string | HTMLCanvasElement | ImageBitmap | null,
      options: SetCoverCubeTextureOptions = {},
    ) => {
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;

      let messageSource: CoverCubeTextureMessageSource = null;
      let transferables: Transferable[] = [];

      if (typeof source === 'string') {
        messageSource = { kind: 'url', url: source };
      } else if (source instanceof HTMLCanvasElement) {
        const bitmap = await createImageBitmap(source);

        if (requestId !== requestIdRef.current) {
          bitmap.close();
          return;
        }

        messageSource = { kind: 'bitmap', bitmap };
        transferables = [bitmap];
      } else if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
        messageSource = { kind: 'bitmap', bitmap: source };
        transferables = [source];
      }

      workerRef.current?.postMessage(
        {
          type: 'setTexture',
          requestId,
          source: messageSource,
          options,
        } satisfies CoverCubeWorkerMessage,
        transferables,
      );
    };

    window.setCoverCubeTexture = (source, options = {}) => {
      void sendTexture(source, options);
    };

    return () => {
      if (window.setCoverCubeTexture) {
        delete window.setCoverCubeTexture;
      }
      if (window.resetCoverCubeTexture) {
        delete window.resetCoverCubeTexture;
      }
    };
  }, []);

  React.useEffect(() => {
    const source = albumArt ?? null;
    window.resetCoverCubeTexture = () => {
      window.setCoverCubeTexture?.(source, { frontOnly: true });
    };
    window.setCoverCubeTexture?.(source, { frontOnly: true });
  }, [albumArt]);

  React.useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      if (!pointerDraggingRef.current || !coverRef.current) {
        return;
      }

      const coordinates = getCoverCoordinates(coverRef.current, event);
      postWorkerMessage({
        type: 'pointerMove',
        x: coordinates.x,
        y: coordinates.y,
      });
    };

    const handlePointerUp = () => {
      if (!pointerDraggingRef.current) {
        return;
      }

      pointerDraggingRef.current = false;
      postWorkerMessage({ type: 'pointerUp' });
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [postWorkerMessage]);

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!coverRef.current) {
        return;
      }

      pointerDraggingRef.current = true;
      const coordinates = getCoverCoordinates(coverRef.current, event);
      postWorkerMessage({
        type: 'pointerDown',
        x: coordinates.x,
        y: coordinates.y,
      });
    },
    [postWorkerMessage],
  );

  return (
    <div
      ref={coverRef}
      aria-label="3D glass cover"
      className={className}
      onPointerDown={handlePointerDown}
      style={{
        background: 'transparent',
        cursor: 'grab',
        overflow: 'visible',
        position: 'relative',
        touchAction: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: renderFailed ? 'none' : 'block',
          inset: 0,
          pointerEvents: 'none',
          position: 'absolute',
        }}
      />
      {renderFailed && (
        <div
          aria-hidden="true"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, #141827)`,
            borderRadius: '18px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.25), 0 18px 36px rgba(7,18,36,.22)',
            inset: '8%',
            overflow: 'hidden',
            opacity: 0.92,
            position: 'absolute',
          }}
        >
          {albumArt && (
            <img
              alt=""
              src={albumArt}
              style={{
                display: 'block',
                height: '100%',
                objectFit: 'cover',
                width: '100%',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
