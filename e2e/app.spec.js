const { expect, test } = require('@playwright/test');
const { spawn, spawnSync } = require('node:child_process');
const { createRequire } = require('node:module');
const net = require('node:net');
const path = require('node:path');

const frontDir = path.resolve(__dirname, '..');
const backDir = path.resolve(frontDir, '..', 'Back');
const requireFromBack = createRequire(path.join(backDir, 'package.json'));
const { MongoMemoryServer } = requireFromBack('mongodb-memory-server');

let mongoServer;
let backend;
let frontend;
let backendUrl;
let frontendUrl;

async function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() =>
        typeof address === 'object' && address
          ? resolve(address.port)
          : reject(new Error('No free port')),
      );
    });
  });
}

async function waitForHttp(url, timeoutMs = 25_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
      lastError = new Error(`${url} returned ${res.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw lastError instanceof Error ? lastError : new Error(`Timed out waiting for ${url}`);
}

function spawnLogged(command, args, options) {
  const child = spawn(command, args, options);
  let output = '';
  const collect = (chunk) => {
    output += chunk.toString();
    if (output.length > 8000) output = output.slice(-8000);
  };

  child.stdout.on('data', collect);
  child.stderr.on('data', collect);
  child.on('exit', (code) => {
    if (code && code !== 0) console.error(output);
  });

  return child;
}

function runChecked(command, args, options) {
  const result = spawnSync(command, args, {
    ...options,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\n${result.stdout}\n${result.stderr}`);
  }
}

async function api(pathname, options = {}, token) {
  const res = await fetch(`${backendUrl}/api/v1${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error?.message || `HTTP ${res.status}`);
  return body.data;
}

async function createLiveEvent() {
  const seed = Date.now();
  const registered = await api('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `e2e-dj-${seed}@example.com`,
      password: 'StrongPass123!',
      displayName: 'E2E DJ',
      role: 'DJ',
    }),
  });

  await api(`/auth/verify-email/${registered.emailVerificationToken}`);

  const event = await api(
    '/events',
    {
      method: 'POST',
      body: JSON.stringify({
        name: 'E2E Event',
        description: 'Browser-driven event',
        startsAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    },
    registered.token,
  ).then((data) => data.event);

  await api(`/events/${event.id}/start`, { method: 'POST' }, registered.token);

  return { event, djToken: registered.token, user: registered.user };
}

function tinyWav() {
  const sampleRate = 8000;
  const frames = 800;
  const dataBytes = frames * 2;
  const buffer = Buffer.alloc(44 + dataBytes);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataBytes, 40);

  return buffer;
}

async function setDjSession(page, { event, token, user }) {
  await page.evaluate(
    ({ event, token, user }) => {
      const eventId = event.id || event._id;
      const userId = user.id || user._id;
      const windowSessionId =
        sessionStorage.getItem('singleUserSession:windowId') || crypto.randomUUID();
      sessionStorage.setItem('singleUserSession:windowId', windowSessionId);
      localStorage.setItem(`activeUserSession:${userId}`, windowSessionId);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user:v1', JSON.stringify(user));
      localStorage.setItem(
        'currentEvent:v1',
        JSON.stringify({
          accessCode: event.accessCode,
          eventId,
          ownerName: user.displayName || 'DJ',
        }),
      );
      localStorage.setItem(
        'currentParticipant:v1',
        JSON.stringify({
          _id: userId,
          nickname: user.displayName || 'DJ',
          eventId,
          profilePicture: user.profilePicture || null,
        }),
      );
    },
    { event, token, user },
  );
}

test.beforeAll(async () => {
  const [backendPort, frontendPort] = await Promise.all([freePort(), freePort()]);
  backendUrl = `http://127.0.0.1:${backendPort}`;
  frontendUrl = `http://127.0.0.1:${frontendPort}`;
  mongoServer = await MongoMemoryServer.create();

  backend = spawnLogged(process.execPath, ['src/index.js'], {
    cwd: backDir,
    env: {
      ...process.env,
      NODE_ENV: 'test',
      PORT: String(backendPort),
      MONGODB_URI: mongoServer.getUri(),
      JWT_SECRET: 'e2e-secret-key-for-running-browser-tests',
      DEBUG_EMAIL: 'true',
      FRONTEND_URL: frontendUrl,
      ALLOWED_ORIGINS: frontendUrl,
      SOCKET_CORS_ORIGIN: frontendUrl,
    },
  });
  await waitForHttp(`${backendUrl}/api/v1/ping/health`);

  const frontendEnv = {
    ...process.env,
    BROWSER: 'none',
    VITE_API_URL: backendUrl,
    VITE_BACKEND_PROXY_TARGET: backendUrl,
  };

  runChecked('npx', ['vite', 'optimize', '--force'], {
    cwd: frontDir,
    env: frontendEnv,
  });

  frontend = spawnLogged('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort)], {
    cwd: frontDir,
    env: frontendEnv,
  });
  await waitForHttp(frontendUrl);
});

test.afterAll(async () => {
  frontend?.kill();
  backend?.kill();
  await mongoServer?.stop();
});

test('attendee joins a real live event and suggests a song through the UI', async ({ page }) => {
  const { event, djToken } = await createLiveEvent();
  const songTitle = `Browser Song ${Date.now()}`;

  await page.goto(`${frontendUrl}/attendee/songs`);
  await page.waitForTimeout(1500);

  await page.goto(frontendUrl);
  await expect(page.getByRole('button', { name: 'Attendee' })).toBeVisible();
  await page.getByRole('button', { name: 'Attendee' }).click();

  await expect(page.getByRole('heading', { name: 'Join the event' })).toBeVisible();
  await page.getByLabel('Nickname').fill('BrowserGuest');
  await page.getByLabel('Access code').fill(event.accessCode);
  await page.getByRole('button', { name: 'Continue' }).click();

  await expect(page.getByRole('button', { name: 'Join event' })).toBeVisible();
  await page.getByRole('button', { name: 'Join event' }).click();

  await expect(page.getByRole('button', { name: 'Queue a song' })).toBeVisible();
  await page.getByRole('button', { name: 'Queue a song' }).click();

  await expect(page.getByRole('heading', { name: 'Suggest a Song' })).toBeVisible();
  await page.getByLabel('Song title').fill(songTitle);
  await page.getByLabel('Artist').fill('Browser Artist');
  await page.getByRole('button', { name: 'Suggest Song' }).click();

  await expect.poll(async () => {
    const pending = await api(`/songs/${event.id}/pending`, {}, djToken).then((data) => data.pending);
    return pending.some((song) => song.title === songTitle && song.artist === 'Browser Artist');
  }).toBe(true);
});

test('DJ uploads a recognition track after localStorage token changes', async ({ page }) => {
  const owner = await createLiveEvent();
  const other = await createLiveEvent();

  await page.addInitScript(
    ({ event, token, user }) => {
      const eventId = event.id || event._id;
      const userId = user.id || user._id;
      const windowSessionId =
        sessionStorage.getItem('singleUserSession:windowId') || crypto.randomUUID();
      sessionStorage.setItem('singleUserSession:windowId', windowSessionId);
      localStorage.setItem(`activeUserSession:${userId}`, windowSessionId);
      localStorage.setItem('authToken', token);
      localStorage.setItem('user:v1', JSON.stringify(user));
      localStorage.setItem(
        'currentEvent:v1',
        JSON.stringify({
          accessCode: event.accessCode,
          eventId,
          ownerName: user.displayName || 'DJ',
        }),
      );
      localStorage.setItem(
        'currentParticipant:v1',
        JSON.stringify({
          _id: userId,
          nickname: user.displayName || 'DJ',
          eventId,
          profilePicture: user.profilePicture || null,
        }),
      );
    },
    { event: owner.event, token: other.djToken, user: owner.user },
  );

  const uploadResponse = page.waitForResponse((response) =>
    response.url().includes(`/api/v1/events/${owner.event.id}/audio-tracks`) &&
    response.request().method() === 'POST',
    { timeout: 20_000 },
  );

  await page.goto(`${frontendUrl}/dj/songs`);
  await setDjSession(page, {
    event: owner.event,
    token: owner.djToken,
    user: owner.user,
  });
  await page.getByRole('button', { name: 'Upload recognition track' }).click();
  await page.getByLabel('Title').fill('Browser Fingerprint');
  await page.getByLabel('Artist').fill('Browser Artist');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'tiny.wav',
    mimeType: 'audio/wav',
    buffer: tinyWav(),
  });
  await page.getByRole('button', { name: 'Fingerprint Track' }).click();

  expect((await uploadResponse).status()).toBe(201);
  await expect(page.getByText('Fingerprinted Browser Fingerprint')).toBeVisible();
});
