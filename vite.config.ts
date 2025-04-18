import path from 'path';
import { defineConfig } from 'vite';
import type { Connect } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';

const LOGO_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const LOGO_CACHE_CONTROL = `public, max-age=${LOGO_CACHE_MAX_AGE_SECONDS}, immutable`;
const LOGO_EXPIRES = 'Thu, 31 Dec 2037 23:55:55 GMT';
const logoPngPattern = /\/assets\/logo_(?:normal|white)(?:-[\w-]+)?\.png$/;

function setLogoCacheHeaders(req: Connect.IncomingMessage, res: Connect.ServerResponse) {
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
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
  },
});
