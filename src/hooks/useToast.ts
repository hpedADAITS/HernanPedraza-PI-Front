import { create } from 'zustand';
import { useCallback, useRef, type RefObject } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  timestamp: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

const TOAST_DURATION = 4000;
const TOAST_ID_PREFIX = 'toast-';

function generateToastId(): string {
  return `${TOAST_ID_PREFIX}${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = generateToastId();
    const timestamp = Date.now();

    set((state) => ({
      toasts: [...state.toasts, { id, type, message, timestamp }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, TOAST_DURATION);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore();
  const toastRefs = useRef<Map<string, RefObject<{ close: () => void }>>>(new Map());

  const success = useCallback(
    (message: string) => {
      addToast('success', message);
    },
    [addToast]
  );

  const error = useCallback(
    (message: string) => {
      addToast('error', message);
    },
    [addToast]
  );

  const info = useCallback(
    (message: string) => {
      addToast('info', message);
    },
    [addToast]
  );

  const warning = useCallback(
    (message: string) => {
      addToast('warning', message);
    },
    [addToast]
  );

  const promise = async <T,>(
    promise: Promise<T>,
    messages: {
      loading?: string;
      success?: string;
      error?: string;
    }
  ): Promise<T> => {
    const loadingMsg = messages.loading ?? 'Loading...';
    const successMsg = messages.success ?? 'Success!';
    const errorMsg = messages.error ?? 'An error occurred';

    info(loadingMsg);

    try {
      const result = await promise;
      removeToast(`loading-${Date.now()}`);
      success(successMsg);
      return result;
    } catch (err) {
      removeToast(`loading-${Date.now()}`);
      error(errorMsg);
      throw err;
    }
  };

  return {
    success,
    error,
    info,
    warning,
    promise,
    clearAll,
    toast: {
      success,
      error,
      info,
      warning,
      promise,
      clearAll,
    },
  };
}