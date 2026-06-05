import coreURL from '@ffmpeg/core?url';
import wasmURL from '@ffmpeg/core/wasm?url';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

let ffmpegPromise: Promise<FFmpeg> | null = null;

function isWav(file: File) {
  return file.type.includes('wav') || file.name.toLowerCase().endsWith('.wav');
}

async function loadFfmpeg() {
  if (ffmpegPromise) return ffmpegPromise;

  ffmpegPromise = (async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({ coreURL, wasmURL });
    return ffmpeg;
  })();

  return ffmpegPromise;
}

export async function toBrowserWav(file: File, onProgress?: (percent: number) => void) {
  if (isWav(file)) return file;

  const ffmpeg = await loadFfmpeg();
  const input = `input-${Date.now()}.${file.name.split('.').pop() || 'mp3'}`;
  const output = `output-${Date.now()}.wav`;

  ffmpeg.on('progress', ({ progress }) => {
    const percent = Math.round((progress || 0) * 100);
    console.log(`[FFmpeg] Converting ${file.name}: ${percent}%`);
    onProgress?.(percent);
  });

  await ffmpeg.writeFile(input, await fetchFile(file));
  await ffmpeg.exec(['-i', input, '-ac', '1', '-ar', '16000', '-f', 'wav', output]);
  console.log(`[FFmpeg] Finished converting ${file.name}`);
  const data = await ffmpeg.readFile(output);
  await Promise.all([
    ffmpeg.deleteFile(input).catch(() => {}),
    ffmpeg.deleteFile(output).catch(() => {}),
  ]);

  const wavBytes = data instanceof Uint8Array ? new Uint8Array(data) : new TextEncoder().encode(data);

  return new File([wavBytes], `${file.name}.wav`, {
    type: 'audio/wav',
  });
}
