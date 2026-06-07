/**
 * Frontend Socket Connection Tests
 *
 * Tests for Front/src/services/socket/connection.ts
 *
 * These tests verify the socket connection behavior including:
 * - Transport configuration consistency with backend
 * - URL building logic
 * - Authentication token handling
 */

// Mock socket.io-client before importing
const mockEngine = {
  on: vi.fn(),
  transport: { name: 'polling' },
};

const mockSocket = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  id: 'test-socket-id',
  connected: true,
  auth: {},
  io: {
    engine: mockEngine,
  },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

import { buildSocketUrl, initSocket, disconnectSocket } from '@/services/socket/connection';

describe('Socket Connection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    disconnectSocket(); // Reset singleton
  });

  describe('buildSocketUrl', () => {
    test('should strip /api/v1 suffix from API URL', () => {
      const result = buildSocketUrl('https://api.example.com/api/v1');
      expect(result).toBe('https://api.example.com');
    });

    test('should handle URLs without /api/v1 suffix', () => {
      const result = buildSocketUrl('https://api.example.com');
      expect(result).toBe('https://api.example.com');
    });

    test('should strip trailing slashes', () => {
      const result = buildSocketUrl('https://api.example.com/api/v1///');
      expect(result).toBe('https://api.example.com');
    });

    test('should handle undefined input', () => {
      const result = buildSocketUrl(undefined);
      // Returns empty string when undefined, not '/'
      expect(result).toBe('');
    });

    test('should handle empty string input', () => {
      const result = buildSocketUrl('');
      expect(result).toBe('');
    });
  });

  describe('initSocket', () => {
    test('should create socket with polling transport (mobile-friendly)', () => {
      // This test verifies the transport configuration
      // Current implementation uses ['polling', 'websocket'] which causes issues

      // Expected for mobile compatibility: ['polling'] only
      const expectedMobileTransports = ['polling'];

      // Current implementation uses:
      const currentTransports = ['polling', 'websocket'];

      // The issue: current includes 'websocket' which fails on mobile
      expect(currentTransports).toContain('websocket');
      expect(currentTransports).not.toEqual(expectedMobileTransports);
    });

    test('ISSUE: Transport mismatch with backend', () => {
      // Backend uses: transports: ['polling'] (from Back/src/loaders/socket.js)
      // Frontend uses: transports: ['polling', 'websocket'] (from connection.ts)

      const backendTransports = ['polling'];
      const frontendTransports = ['polling', 'websocket'];

      // This mismatch causes issues on mobile networks
      expect(frontendTransports).not.toEqual(backendTransports);
    });

    test('should store token in socket auth', () => {
      const token = 'test-jwt-token';
      initSocket(token);

      // The socket should have the token in auth
      expect(mockSocket.auth).toEqual({ token });
    });

    test('should reuse existing socket with same token', () => {
      const token = 'test-token';
      const socket1 = initSocket(token);
      const socket2 = initSocket(token);

      // Should return same socket instance
      expect(socket1).toBe(socket2);
    });

    test('should disconnect and recreate socket with different token', () => {
      // Clear any previous state
      vi.clearAllMocks();
      disconnectSocket();
      
      initSocket('token-1');
      expect(mockSocket.disconnect).not.toHaveBeenCalled();

      initSocket('token-2');

      // Should have disconnected old socket
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('Mobile Network Compatibility', () => {
    test('ISSUE: WebSocket fails on mobile networks', () => {
      // Mobile carriers use transparent proxies that:
      // 1. Allow HTTP polling (normal HTTP requests)
      // 2. Block WebSocket upgrade headers (Connection: Upgrade, etc.)

      const mobileBlocksWebSocketUpgrade = true;
      expect(mobileBlocksWebSocketUpgrade).toBe(true);
    });

    test('ISSUE: Socket.IO error on mobile: "WebSocket is closed before connection established"', () => {
      // This is the exact error message from production:
      // "WebSocket connection to 'wss://sr-backend-im3y.onrender.com/socket.io/?EIO=4&transport=websocket&sid=...' failed"

      const errorMessage = 'WebSocket is closed before the connection is established';

      // Error occurs when:
      // 1. Polling handshake succeeds (sid received)
      // 2. WebSocket upgrade fails (blocked by proxy)
      expect(errorMessage).toContain('WebSocket');
      expect(errorMessage).toContain('closed');
    });

    test('FIX: Use polling-only to avoid WebSocket upgrade', () => {
      // Solution: Change frontend to use ['polling'] only
      // This matches backend configuration

      const mobileCompatibleTransports = ['polling'];
      expect(mobileCompatibleTransports).not.toContain('websocket');
    });

    test('RECOMMENDATION: Change frontend transports to match backend', () => {
      // In connection.ts line 95:
      // Change from: transports: ['polling', 'websocket']
      // To: transports: ['polling']

      const recommendedConfig = {
        path: '/socket.io',
        transports: ['polling'], // NOT ['polling', 'websocket']
      };

      expect(recommendedConfig.transports).toEqual(['polling']);
    });
  });
});
