import '@testing-library/jest-dom';
import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';

/* Mock useToast hook - supports both patterns:
 * const { toast } = useToast() -> toast.error()
 * const toast = useToast() -> toast.error()
 */
const mockToastFn = () => {};
const mockToastMethods = {
  success: mockToastFn,
  error: mockToastFn,
  info: mockToastFn,
  warning: mockToastFn,
  promise: mockToastFn,
};
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({
    ...mockToastMethods,
    toast: mockToastMethods,
  }),
  useToastStore: () => ({
    toasts: [],
    addToast: mockToastFn,
    removeToast: mockToastFn,
    clearAll: mockToastFn,
  }),
}));

/* Cleanup after each test */
afterEach(() => {
  cleanup();
});

/* Mock window.matchMedia */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

/* Mock socket.io-client */
const socketIoMock = vi.fn(() => ({
  on: vi.fn(),
  emit: vi.fn(),
  off: vi.fn(),
  disconnect: vi.fn(),
  connect: vi.fn(),
  io: {
    engine: {
      on: vi.fn(),
      transport: {
        name: 'websocket',
      },
    },
  },
}));

vi.mock('socket.io-client', () => ({
  default: socketIoMock,
  io: socketIoMock,
}));

/* Suppress console warnings in tests */
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
