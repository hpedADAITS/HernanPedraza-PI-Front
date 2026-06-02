# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: app.spec.js >> DJ uploads a recognition track after localStorage token changes
- Location: e2e/app.spec.js:238:1

# Error details

```
Test timeout of 120000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 120000ms exceeded.
```

# Test source

```ts
  178 |   await waitForHttp(`${backendUrl}/api/v1/ping/health`);
  179 | 
  180 |   const frontendEnv = {
  181 |     ...process.env,
  182 |     BROWSER: 'none',
  183 |     VITE_API_URL: backendUrl,
  184 |     VITE_BACKEND_PROXY_TARGET: backendUrl,
  185 |   };
  186 | 
  187 |   runChecked('npx', ['vite', 'optimize', '--force'], {
  188 |     cwd: frontDir,
  189 |     env: frontendEnv,
  190 |   });
  191 | 
  192 |   frontend = spawnLogged('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(frontendPort)], {
  193 |     cwd: frontDir,
  194 |     env: frontendEnv,
  195 |   });
  196 |   await waitForHttp(frontendUrl);
  197 | });
  198 | 
  199 | test.afterAll(async () => {
  200 |   frontend?.kill();
  201 |   backend?.kill();
  202 |   await mongoServer?.stop();
  203 | });
  204 | 
  205 | test('attendee joins a real live event and suggests a song through the UI', async ({ page }) => {
  206 |   const { event, djToken } = await createLiveEvent();
  207 |   const songTitle = `Browser Song ${Date.now()}`;
  208 | 
  209 |   await page.goto(`${frontendUrl}/attendee/songs`);
  210 |   await page.waitForTimeout(1500);
  211 | 
  212 |   await page.goto(frontendUrl);
  213 |   await expect(page.getByRole('button', { name: 'Attendee' })).toBeVisible();
  214 |   await page.getByRole('button', { name: 'Attendee' }).click();
  215 | 
  216 |   await expect(page.getByRole('heading', { name: 'Join the event' })).toBeVisible();
  217 |   await page.getByLabel('Nickname').fill('BrowserGuest');
  218 |   await page.getByLabel('Access code').fill(event.accessCode);
  219 |   await page.getByRole('button', { name: 'Continue' }).click();
  220 | 
  221 |   await expect(page.getByRole('button', { name: 'Join event' })).toBeVisible();
  222 |   await page.getByRole('button', { name: 'Join event' }).click();
  223 | 
  224 |   await expect(page.getByRole('button', { name: 'Queue a song' })).toBeVisible();
  225 |   await page.getByRole('button', { name: 'Queue a song' }).click();
  226 | 
  227 |   await expect(page.getByRole('heading', { name: 'Suggest a Song' })).toBeVisible();
  228 |   await page.getByLabel('Song title').fill(songTitle);
  229 |   await page.getByLabel('Artist').fill('Browser Artist');
  230 |   await page.getByRole('button', { name: 'Suggest Song' }).click();
  231 | 
  232 |   await expect.poll(async () => {
  233 |     const pending = await api(`/songs/${event.id}/pending`, {}, djToken).then((data) => data.pending);
  234 |     return pending.some((song) => song.title === songTitle && song.artist === 'Browser Artist');
  235 |   }).toBe(true);
  236 | });
  237 | 
  238 | test('DJ uploads a recognition track after localStorage token changes', async ({ page }) => {
  239 |   const owner = await createLiveEvent();
  240 |   const other = await createLiveEvent();
  241 |   const fixture = path.resolve(
  242 |     frontDir,
  243 |     '..',
  244 |     'audio-recognition-service-node/data/recording1.wav',
  245 |   );
  246 | 
  247 |   await page.addInitScript(
  248 |     ({ event, token, user }) => {
  249 |       const eventId = event.id || event._id;
  250 |       const userId = user.id || user._id;
  251 |       const windowSessionId =
  252 |         sessionStorage.getItem('singleUserSession:windowId') || crypto.randomUUID();
  253 |       sessionStorage.setItem('singleUserSession:windowId', windowSessionId);
  254 |       localStorage.setItem(`activeUserSession:${userId}`, windowSessionId);
  255 |       localStorage.setItem('authToken', token);
  256 |       localStorage.setItem('user:v1', JSON.stringify(user));
  257 |       localStorage.setItem(
  258 |         'currentEvent:v1',
  259 |         JSON.stringify({
  260 |           accessCode: event.accessCode,
  261 |           eventId,
  262 |           ownerName: user.displayName || 'DJ',
  263 |         }),
  264 |       );
  265 |       localStorage.setItem(
  266 |         'currentParticipant:v1',
  267 |         JSON.stringify({
  268 |           _id: userId,
  269 |           nickname: user.displayName || 'DJ',
  270 |           eventId,
  271 |           profilePicture: user.profilePicture || null,
  272 |         }),
  273 |       );
  274 |     },
  275 |     { event: owner.event, token: other.djToken, user: owner.user },
  276 |   );
  277 | 
> 278 |   const uploadResponse = page.waitForResponse((response) =>
      |                               ^ Error: page.waitForResponse: Test timeout of 120000ms exceeded.
  279 |     response.url().includes(`/api/v1/events/${owner.event.id}/audio-tracks`) &&
  280 |     response.request().method() === 'POST',
  281 |   );
  282 | 
  283 |   await page.goto(`${frontendUrl}/dj/songs`);
  284 |   await setDjSession(page, {
  285 |     event: owner.event,
  286 |     token: owner.djToken,
  287 |     user: owner.user,
  288 |   });
  289 |   await page.getByRole('button', { name: 'Upload recognition track' }).click();
  290 |   await page.getByLabel('Title').fill('Browser Fingerprint');
  291 |   await page.getByLabel('Artist').fill('Browser Artist');
  292 |   await page.locator('input[type="file"]').setInputFiles(fixture);
  293 |   await page.getByRole('button', { name: 'Fingerprint Track' }).click();
  294 | 
  295 |   expect((await uploadResponse).status()).toBe(201);
  296 |   await expect(page.getByText('Fingerprinted Browser Fingerprint')).toBeVisible();
  297 | });
  298 | 
```