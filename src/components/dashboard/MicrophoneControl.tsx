import React, { useRef, useEffect } from 'react';
import { AlertCircle, Mic, MicOff } from 'lucide-react';
import { useMicrophone } from '@/hooks/useMicrophone';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { t } from '@/i18n';

interface MicrophoneControlProps {
  isDj: boolean;
}

export function MicrophoneControl({ isDj }: MicrophoneControlProps) {
  const {
    isListening,
    isAccessDenied,
    isNoSuitableMicFound,
    requestMicrophoneAccess,
    stopMicrophone,
    dismissMicrophoneIssue,
    error,
  } = useMicrophone(isDj);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    /* Initialize Web Audio API if not already done */
    if (!audioContextRef.current && typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
    }
  }, []);

  const handleToggleMicrophone = async () => {
    if (isListening) {
      stopMicrophone();
    } else {
      await requestMicrophoneAccess();
    }
  };

  /* Only show for DJ role */
  if (!isDj) {
    return null;
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleToggleMicrophone}
          className={`flex h-12 items-center gap-2 rounded-xl px-4 font-medium shadow-md transition-all duration-200 ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
              : isAccessDenied && !isNoSuitableMicFound
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
          }`}
          disabled={isAccessDenied && !isListening && !isNoSuitableMicFound}
          title={
            isAccessDenied && !isListening
              ? isNoSuitableMicFound
                ? t('No suitable microphone found')
                : t('Microphone access denied')
              : undefined
          }
        >
          {isListening ? (
            <>
              <MicOff className="w-5 h-5" />
              <span className="hidden sm:inline">{t('Stop recording')}</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span className="hidden sm:inline">{t('Use microphone')}</span>
            </>
          )}
        </button>

        {isListening && (
          <div className="flex items-center gap-2">
            <div className="relative w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {t('Recording')}
            </span>
          </div>
        )}
      </div>

      <AlertDialog
        open={isNoSuitableMicFound}
        onOpenChange={(open) => {
          if (!open) dismissMicrophoneIssue();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-700">
              <AlertCircle className="h-5 w-5" />
            </div>
            <AlertDialogTitle>{t('No microphone found')}</AlertDialogTitle>
            <AlertDialogDescription>
              {error ||
                t('Connect or enable a microphone, then try starting recording again.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={dismissMicrophoneIssue}>
              {t('Close')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void requestMicrophoneAccess();
              }}
            >
              {t('Try Again')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
