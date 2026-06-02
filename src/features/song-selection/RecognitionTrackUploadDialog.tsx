import { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  SettingsDialog,
  SettingsDialogActions,
  SettingsDialogButton,
} from '@/components/settings/SettingsUI';
import { audioTracksAPI, eventsAPI } from '@/services/api';
import { toBrowserWav } from '@/services/audio/ffmpegWav';
import { t } from '@/i18n';

interface RecognitionTrackUploadDialogProps {
  eventId: string | null;
  open: boolean;
  onClose: () => void;
}

export function RecognitionTrackUploadDialog({
  eventId,
  open,
  onClose,
}: RecognitionTrackUploadDialogProps) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [coverUrl, setCoverUrl] = useState('');

  const close = () => {
    if (!busy) onClose();
  };

  const upload = async () => {
    if (!eventId || !file || !title.trim() || !artist.trim()) {
      toast.error(t('Select audio and enter title and artist'));
      return;
    }

    setBusy(true);
    try {
      const [wav, ownedEvent] = await Promise.all([
        toBrowserWav(file),
        eventsAPI.getMyActiveEvent().catch(() => null),
      ]);
      const uploadEventId = ownedEvent?.id || ownedEvent?._id || eventId;
      const track = await audioTracksAPI.uploadTrack(
        uploadEventId,
        wav,
        title.trim(),
        artist.trim(),
        coverUrl.trim(),
      );
      toast.success(t('Fingerprinted {title}', { title: track.title }));
      setFile(null);
      setTitle('');
      setArtist('');
      setCoverUrl('');
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('Audio upload failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SettingsDialog open={open} title={t('Recognition Track')} onClose={close}>
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          {t('Title')}
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            disabled={busy}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('Artist')}
          <input
            value={artist}
            onChange={(event) => setArtist(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            disabled={busy}
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          {t('Cover URL')}
          <input
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-slate-300 px-3 text-sm"
            disabled={busy}
            placeholder="https://..."
          />
        </label>
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-700">
          <Upload size={18} />
          <span>{file ? file.name : t('Choose MP3 or WAV')}</span>
          <input
            type="file"
            accept="audio/mpeg,audio/mp3,audio/wav,audio/x-wav,.mp3,.wav"
            className="hidden"
            disabled={busy}
            onChange={(event) => {
              const nextFile = event.target.files?.[0] || null;
              setFile(nextFile);
              if (nextFile && !title) setTitle(nextFile.name.replace(/\.[^.]+$/, ''));
            }}
          />
        </label>
      </div>
      <SettingsDialogActions>
        <SettingsDialogButton
          onClick={upload}
          disabled={busy}
          className="w-full flex-none"
        >
          {busy ? t('Processing...') : t('Fingerprint Track')}
        </SettingsDialogButton>
      </SettingsDialogActions>
    </SettingsDialog>
  );
}
