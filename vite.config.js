var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import os from 'os';
function getLocalIp() {
    var e_1, _a, e_2, _b;
    var interfaces = os.networkInterfaces();
    try {
        for (var _c = __values(Object.keys(interfaces)), _d = _c.next(); !_d.done; _d = _c.next()) {
            var name_1 = _d.value;
            try {
                for (var _e = (e_2 = void 0, __values(interfaces[name_1])), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var iface = _f.value;
                    if (iface.family === 'IPv4' && !iface.internal) {
                        return iface.address;
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
        }
        finally { if (e_1) throw e_1.error; }
    }
    return 'localhost';
}
var isHost = process.argv.includes('--host');
var localIp = isHost ? getLocalIp() : 'localhost';
var apiUrl = "http://".concat(localIp, ":5000");
export default defineConfig({
    define: {
        'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    plugins: [react()],
    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
        alias: {
            'vaul@1.1.2': 'vaul',
            'sonner@2.0.3': 'sonner',
            'recharts@2.15.2': 'recharts',
            'react-resizable-panels@2.1.7': 'react-resizable-panels',
            'react-hook-form@7.55.0': 'react-hook-form',
            'react-day-picker@8.10.1': 'react-day-picker',
            'next-themes@0.4.6': 'next-themes',
            'lucide-react@0.487.0': 'lucide-react',
            'input-otp@1.4.2': 'input-otp',
            'figma:asset/b80a222536e5acd2e9e6b97aa41bab4feddda6b4.png': path.resolve(__dirname, './src/assets/b80a222536e5acd2e9e6b97aa41bab4feddda6b4.png'),
            'figma:asset/7fd30e3b4334b9462db2adf0746adefd6b2405a7.png': path.resolve(__dirname, './src/assets/7fd30e3b4334b9462db2adf0746adefd6b2405a7.png'),
            'embla-carousel-react@8.6.0': 'embla-carousel-react',
            'cmdk@1.1.1': 'cmdk',
            'class-variance-authority@0.7.1': 'class-variance-authority',
            '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
            '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
            '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
            '@radix-ui/react-tabs@1.1.3': '@radix-ui/react-tabs',
            '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
            '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
            '@radix-ui/react-slider@1.2.3': '@radix-ui/react-slider',
            '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
            '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
            '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
            '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
            '@radix-ui/react-progress@1.1.2': '@radix-ui/react-progress',
            '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
            '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
            '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
            '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
            '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
            '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
            '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
            '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
            '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
            '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
            '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-alert-dialog@1.1.6': '@radix-ui/react-alert-dialog',
            '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
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
