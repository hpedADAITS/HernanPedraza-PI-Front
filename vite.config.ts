
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react-swc';
  import path from 'node:path';
  import os from 'node:os';

  function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  }

  const isHost = process.argv.includes('--host');
  const localIp = isHost ? getLocalIp() : 'localhost';
  const apiUrl = `http://${localIp}:5000`;

  export default defineConfig({
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    plugins: [react()],
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