import { useState } from 'react';
import { Headphones, ListMusic, Mic, QrCode, Search, Users } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { consumePendingTutorial, type TutorialRole } from '@/components/modals/firstTimeTutorialQueue';
import { t } from '@/i18n';

const TUTORIALS = {
  attendee: {
    title: 'Welcome to the event',
    description: 'Use this space to request music and follow what the DJ is playing.',
    steps: [
      { icon: Search, text: 'Search for a track and send it as a suggestion.' },
      { icon: ListMusic, text: 'Check the queue to see accepted songs and vote on requests.' },
      { icon: Headphones, text: 'Watch now playing for the current track and event updates.' },
    ],
  },
  dj: {
    title: 'Your DJ event is ready',
    description: 'Manage requests, attendees, and playback from this dashboard.',
    steps: [
      { icon: QrCode, text: 'Share the event code or QR so attendees can join.' },
      { icon: ListMusic, text: 'Review pending songs and approve or reject requests.' },
      { icon: Users, text: 'Manage connected attendees, cooldowns, kicks, and bans.' },
      { icon: Mic, text: 'Use the phone microphone fallback when the venue setup needs it.' },
    ],
  },
} satisfies Record<TutorialRole, {
  title: string;
  description: string;
  steps: { icon: typeof Search; text: string }[];
}>;

export function FirstTimeTutorialModal({ role }: { role: TutorialRole }) {
  const [state, setState] = useState(() => ({
    open: consumePendingTutorial(role),
    role,
  }));

  if (state.role !== role) {
    setState({ open: consumePendingTutorial(role), role });
  }

  const tutorial = TUTORIALS[role];

  return (
    <AlertDialog
      open={state.open}
      onOpenChange={(open) => setState((current) => ({ ...current, open }))}
    >
      <AlertDialogContent className="max-w-[calc(100%-2rem)] gap-5 rounded-lg p-5 sm:max-w-md sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle>{t(tutorial.title)}</AlertDialogTitle>
          <AlertDialogDescription>{t(tutorial.description)}</AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-3">
          {tutorial.steps.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/70">
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-950">
                <Icon size={16} strokeWidth={2.3} />
              </span>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{t(text)}</p>
            </div>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogAction>{t('Start')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
