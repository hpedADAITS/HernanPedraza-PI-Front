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

export async function toBrowserWav(file: File) {
  if (isWav(file)) return file;

  const ffmpeg = await loadFfmpeg();
  const input = `input-${Date.now()}.${file.name.split('.').pop() || 'mp3'}`;
  const output = `output-${Date.now()}.wav`;

  await ffmpeg.writeFile(input, await fetchFile(file));
  await ffmpeg.exec(['-i', input, '-ac', '1', '-ar', '44100', '-f', 'wav', output]);
  const data = await ffmpeg.readFile(output);
  await Promise.all([
    ffmpeg.deleteFile(input).catch(() => {}),
    ffmpeg.deleteFile(output).catch(() => {}),
  ]);

  return new File([data instanceof Uint8Array ? data : new TextEncoder().encode(data)], `${file.name}.wav`, {
    type: 'audio/wav',
  });
}
