import path from 'path';
import fs from 'fs';
import { defineConfig } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const LOGO_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const LOGO_CACHE_CONTROL = `public, max-age=${LOGO_CACHE_MAX_AGE_SECONDS}, immutable`;
const LOGO_EXPIRES = 'Thu, 31 Dec 2037 23:55:55 GMT';
const logoPngPattern = /\/assets\/logo_(?:normal|white)(?:-[\w-]+)?\.png$/;
const httpsCertPath = process.env.VITE_HTTPS_CERT;
const httpsKeyPath = process.env.VITE_HTTPS_KEY;
const backendProxyTarget = process.env.VITE_BACKEND_PROXY_TARGET || 'http://127.0.0.1:5000';

const httpsConfig =
  httpsCertPath && httpsKeyPath
    ? {
        cert: fs.readFileSync(httpsCertPath),
        key: fs.readFileSync(httpsKeyPath),
      }
    : undefined;

function setLogoCacheHeaders(req: IncomingMessage, res: ServerResponse) {
  if (!req.url || !logoPngPattern.test(req.url.split('?')[0])) {
    return;
  }

  res.setHeader('Cache-Control', LOGO_CACHE_CONTROL);
  res.setHeader('Expires', LOGO_EXPIRES);
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'logo-cache-headers',
      configurePreviewServer(server) {
        server.middlewares.use(setLogoCacheHeaders);
      },
    },
  ],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: [
      {
        find: '@',
        replacement: path.resolve(__dirname, './src'),
      },
      {
        find: /^three$/,
        replacement: path.resolve(
          __dirname,
          './node_modules/three/build/three.module.js',
        ),
      },
      {
        find: /^three\/addons\//,
        replacement: `${path.resolve(__dirname, './node_modules/three/examples/jsm')}/`,
      },
    ],
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  optimizeDeps: {
    include: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: true,
    https: httpsConfig,
    hmr: {
      protocol: httpsConfig ? 'wss' : 'ws',
    },
    proxy: {
      '/api': {
        target: backendProxyTarget,
        changeOrigin: true,
      },
      '/socket.io': {
        target: backendProxyTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
