import React, { useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useMicrophone } from '@/hooks/useMicrophone';

interface MicrophoneControlProps {
  isDj: boolean;
}

export function MicrophoneControl({ isDj }: MicrophoneControlProps) {
  const { isListening, isAccessDenied, requestMicrophoneAccess, stopMicrophone } =
    useMicrophone(isDj);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    // Initialize Web Audio API if not already done
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

  // Only show for DJ role
  if (!isDj) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleToggleMicrophone}
        className={`p-3 rounded-lg transition-all duration-200 flex items-center gap-2 font-medium ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
            : isAccessDenied
              ? 'bg-gray-400 text-white cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
        }`}
        disabled={isAccessDenied && !isListening}
        title={
          isAccessDenied && !isListening ? 'Microphone access denied' : undefined
        }
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5" />
            <span className="hidden sm:inline">Stop Recording</span>
          </>
        ) : (
          <>
            <Mic className="w-5 h-5" />
            <span className="hidden sm:inline">Start Recording</span>
          </>
        )}
      </button>

      {isListening && (
        <div className="flex items-center gap-2">
          <div className="relative w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Recording
          </span>
        </div>
      )}
    </div>
  );
}
