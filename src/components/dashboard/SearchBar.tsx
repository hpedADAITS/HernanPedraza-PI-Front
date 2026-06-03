import React, { useCallback, useEffect, useRef, useState } from 'react';
import { m } from 'motion/react';
import { AlertCircle, Check, Copy, Mic, MicOff, Search, Smartphone } from 'lucide-react';
import { SLIDE_UP } from '@/constants/animations';
import { useMicrophone } from '@/hooks/useMicrophone';
import { useTrackedTimeout } from '@/hooks/useTrackedTimeout';
import { eventsAPI } from '@/services/api';
import { off, onPhoneMicrophoneConnected } from '@/services/socket';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { t } from '@/i18n';
import type { View } from '@/types';

interface SearchBarProps {
  onNavigate: (view: View) => void;
  isDj: boolean;
  isDarkMode?: boolean;
  eventId?: string;
}

export function SearchBar({
  onNavigate,
  isDj,
  isDarkMode = false,
  eventId = '',
}: SearchBarProps) {
  const [phoneMicrophoneLink, setPhoneMicrophoneLink] = useState('');
  const [phoneMicrophoneStatus, setPhoneMicrophoneStatus] = useState('');
  const [connectedMicrophone, setConnectedMicrophone] = useState({ name: '', status: '' });
  const [isLinkCopied, setIsLinkCopied] = useState(false);
  const connectedMicrophoneTimeoutRef = useRef<number | null>(null);
  const { clearTrackedTimeout, setTrackedTimeout } = useTrackedTimeout();
  const {
    isListening,
    isAccessDenied,
    isNoSuitableMicFound,
    requestMicrophoneAccess,
    stopMicrophone,
    dismissMicrophoneIssue,
    error,
  } = useMicrophone(isDj);

  const handleClick = () => {
    const view = isDj ? 'dj-song-select' : 'attendee-song-select';
    onNavigate(view);
  };

  const handleMicrophoneClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();

    if (isListening) {
      stopMicrophone();
      return;
    }

    await requestMicrophoneAccess();
  };

  const loadPhoneMicrophoneLink = useCallback(async () => {
    if (!isDj || !eventId) return;

    try {
      setPhoneMicrophoneLink('');
      setPhoneMicrophoneStatus('');
      const link = await eventsAPI.getPhoneMicrophoneLink(eventId);
      setPhoneMicrophoneLink(link);
    } catch (error) {
      setPhoneMicrophoneLink('');
      setPhoneMicrophoneStatus(
        error instanceof Error
          ? error.message
          : t('Unable to create phone microphone link'),
      );
    }
  }, [eventId, isDj]);

  const copyPhoneMicrophoneLink = async () => {
    if (!phoneMicrophoneLink) return;

    try {
      await navigator.clipboard.writeText(phoneMicrophoneLink);
      setIsLinkCopied(true);
      window.setTimeout(() => setIsLinkCopied(false), 1400);
    } catch {
      setPhoneMicrophoneStatus(t('Copy failed. Open the link and share it from the browser.'));
    }
  };

  const closeMicrophoneDialog = useCallback(() => {
    if (connectedMicrophoneTimeoutRef.current) {
      clearTrackedTimeout(connectedMicrophoneTimeoutRef.current);
      connectedMicrophoneTimeoutRef.current = null;
    }

    setConnectedMicrophone({ name: '', status: '' });
    dismissMicrophoneIssue();
  }, [clearTrackedTimeout, dismissMicrophoneIssue]);

  useEffect(() => {
    if (isAccessDenied) {
      void loadPhoneMicrophoneLink();
    }
  }, [isAccessDenied, loadPhoneMicrophoneLink]);

  useEffect(() => {
    if (!isDj || !eventId) return;

    const handlePhoneMicrophoneConnected = (data: {
      eventId?: string;
      microphone?: { deviceName?: string; eventId?: string };
    }) => {
      const connectedEventId = data?.eventId || data?.microphone?.eventId;
      if (connectedEventId !== eventId) return;

      const deviceName = data.microphone?.deviceName || t('Phone microphone');
      setConnectedMicrophone({
        name: deviceName,
        status: t('{device} connected', { device: deviceName }),
      });
      dismissMicrophoneIssue();

      if (connectedMicrophoneTimeoutRef.current) {
        clearTrackedTimeout(connectedMicrophoneTimeoutRef.current);
      }

      connectedMicrophoneTimeoutRef.current = setTrackedTimeout(() => {
        setConnectedMicrophone((current) => ({ ...current, name: '' }));
        connectedMicrophoneTimeoutRef.current = null;
      }, 1200);
    };

    onPhoneMicrophoneConnected(handlePhoneMicrophoneConnected);

    return () => {
      off('phone_microphone_connected', handlePhoneMicrophoneConnected);
    };
  }, [
    clearTrackedTimeout,
    dismissMicrophoneIssue,
    eventId,
    isDj,
    setTrackedTimeout,
  ]);

  const isMicrophoneDialogOpen =
    isDj && (isAccessDenied || Boolean(connectedMicrophone.name));
  const isMicrophoneConnected = Boolean(connectedMicrophone.name);
  const microphoneStatus = connectedMicrophone.status || phoneMicrophoneStatus;

  return (
    <>
      <section
        className={`relative w-full overflow-hidden rounded-2xl border px-6 py-5 shadow-[0_12px_28px_rgba(15,23,42,0.08),inset_0_1px_0_rgba(255,255,255,0.95)] sm:px-9 sm:py-6 lg:px-5 lg:py-4 ${
          isDarkMode
            ? 'border-white/10 bg-[radial-gradient(circle_at_60%_35%,rgba(70,156,255,0.16),transparent_22%),linear-gradient(180deg,#182235_0%,#111827_100%)] shadow-[0_16px_34px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.08)]'
            : 'border-slate-900/10 bg-[radial-gradient(circle_at_60%_35%,rgba(70,156,255,0.07),transparent_20%),linear-gradient(180deg,#ffffff_0%,#fbfdff_100%)]'
        }`}
        aria-label={t('Search or request a song')}
      >
        <svg
          className="pointer-events-none absolute left-[52%] top-7 hidden h-[50px] w-[190px] opacity-55 md:block"
          viewBox="0 0 190 50"
          aria-hidden="true"
        >
          <g className="fill-[#45b8ff] opacity-25">
            <circle cx="4" cy="24" r="1.4" />
            <circle cx="10" cy="22" r="1.4" />
            <circle cx="16" cy="20" r="1.4" />
            <circle cx="22" cy="18" r="1.4" />
            <circle cx="28" cy="16" r="1.4" />
            <circle cx="34" cy="20" r="1.4" />
            <circle cx="40" cy="24" r="1.4" />
            <circle cx="46" cy="28" r="1.4" />
            <circle cx="52" cy="32" r="1.4" />
          </g>
          <g className="fill-[#45b8ff] opacity-45">
            <circle cx="60" cy="21" r="1.5" />
            <circle cx="66" cy="16" r="1.5" />
            <circle cx="72" cy="10" r="1.5" />
            <circle cx="78" cy="7" r="1.5" />
            <circle cx="84" cy="12" r="1.5" />
            <circle cx="90" cy="20" r="1.5" />
            <circle cx="96" cy="27" r="1.5" />
            <circle cx="102" cy="34" r="1.5" />
            <circle cx="108" cy="39" r="1.5" />
          </g>
          <g className="fill-[#7de0ea] opacity-40">
            <circle cx="116" cy="31" r="1.5" />
            <circle cx="122" cy="26" r="1.5" />
            <circle cx="128" cy="21" r="1.5" />
            <circle cx="134" cy="18" r="1.5" />
            <circle cx="140" cy="20" r="1.5" />
            <circle cx="146" cy="25" r="1.5" />
            <circle cx="152" cy="30" r="1.5" />
          </g>
          <g className="fill-[#45b8ff] opacity-35">
            <circle cx="160" cy="29" r="1.4" />
            <circle cx="166" cy="25" r="1.4" />
            <circle cx="172" cy="22" r="1.4" />
            <circle cx="178" cy="24" r="1.4" />
            <circle cx="184" cy="28" r="1.4" />
          </g>
        </svg>

        <h2
          className={`m-0 text-[22px] font-black leading-tight tracking-normal lg:text-[18px] ${
            isDarkMode ? 'text-white' : 'text-[#101c3a]'
          }`}
        >
          {t('Search or request a song')}
        </h2>
        <p
          className={`mb-[18px] mt-1.5 text-[13px] font-bold leading-snug tracking-normal lg:mb-3 lg:text-[12px] ${
            isDarkMode ? 'text-slate-300' : 'text-[#73829d]'
          }`}
        >
          {isDj
            ? t('Search for the next track and keep the queue moving.')
            : t('Find a track and add it to the queue for the DJ.')}
        </p>

        <div className="flex items-center gap-3 sm:gap-5">
          <m.label
            layoutId="search-bar"
            {...SLIDE_UP}
            transition={{ ...SLIDE_UP.transition, delay: 0.2 }}
            whileHover={{ y: -1 }}
            className={`group flex h-[52px] min-w-0 flex-1 cursor-text items-center gap-3.5 rounded-xl border px-[18px] ${
              isDarkMode
                ? 'border-white/10 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-md'
                : 'border-slate-900/10 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)]'
            }`}
          >
            <Search
              className={`h-5 w-5 flex-shrink-0 transition-colors group-hover:text-[#2878ff] ${
                isDarkMode ? 'text-slate-300' : 'text-[#526990]'
              }`}
            />
            <input
              type="search"
              readOnly
              onClick={handleClick}
              onFocus={handleClick}
              aria-label={t('Search for songs')}
              placeholder={t('Search for artists, songs, albums...')}
              className={`h-full min-w-0 flex-1 cursor-text border-0 bg-transparent text-sm font-semibold tracking-normal outline-none ${
                isDarkMode
                  ? 'text-white placeholder:text-slate-400'
                  : 'text-[#14213f] placeholder:text-[#8b9ab4]'
              }`}
            />
          </m.label>

          {isDj && (
            <button
              type="button"
              onClick={handleMicrophoneClick}
              disabled={isAccessDenied && !isListening && !isNoSuitableMicFound}
              aria-label={isListening ? t('Stop recording') : t('Use microphone')}
              title={
                isAccessDenied && !isListening
                  ? isNoSuitableMicFound
                    ? t('No suitable microphone found')
                    : t('Microphone access denied')
                  : undefined
              }
              className={`grid h-[52px] w-[61px] flex-shrink-0 place-items-center rounded-xl border outline-none transition-all duration-150 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 ${
                isDarkMode
                  ? 'border-white/10 bg-white/10 shadow-[0_10px_20px_rgba(0,0,0,0.22),inset_0_1px_0_rgba(255,255,255,0.10)] hover:shadow-[0_14px_24px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'border-slate-900/10 bg-white shadow-[0_10px_20px_rgba(15,23,42,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] hover:shadow-[0_14px_24px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.95)]'
              } ${
                isListening ? 'text-red-500' : 'text-[#2878ff]'
              }`}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
          )}
        </div>
      </section>

      <AlertDialog
        open={isMicrophoneDialogOpen}
        onOpenChange={(open) => {
          if (!open) closeMicrophoneDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div
              className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full ${
                isMicrophoneConnected
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}
            >
              {isMicrophoneConnected ? (
                <Check className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
            </div>
            <AlertDialogTitle>
              {isMicrophoneConnected
                ? t('Microphone connected')
                : isNoSuitableMicFound
                ? t('No microphone found')
                : t('Microphone unavailable')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isMicrophoneConnected
                ? t('{device} connected', { device: connectedMicrophone.name }) + '.'
                : error ||
                t('Connect or enable a microphone, then try starting recording again.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isDj && eventId && !isMicrophoneConnected && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
                <Smartphone className="h-4 w-4 text-blue-600" />
                {t('Use a phone as microphone')}
              </div>
              <div className="flex min-w-0 items-center gap-2">
                <a
                  href={phoneMicrophoneLink || undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 flex-1 truncate rounded-md bg-white px-3 py-2 text-xs font-medium text-blue-700 ring-1 ring-slate-200"
                >
                  {phoneMicrophoneLink || t('Creating link...')}
                </a>
                <button
                  type="button"
                  onClick={copyPhoneMicrophoneLink}
                  disabled={!phoneMicrophoneLink}
                  className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-md bg-blue-600 text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={t('Copy phone microphone link')}
                >
                  {isLinkCopied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
              {microphoneStatus && (
                <p className="mt-2 text-xs font-medium text-slate-600">
                  {microphoneStatus}
                </p>
              )}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeMicrophoneDialog}>
              {t('Close')}
            </AlertDialogCancel>
            {!isMicrophoneConnected && (
              <AlertDialogAction
                onClick={(event) => {
                  event.preventDefault();
                  void requestMicrophoneAccess();
                }}
              >
                {t('Try Again')}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
