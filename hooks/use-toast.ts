"use client";

// Simplified toast hook compatible with shadcn/ui Toaster
import { useState, useCallback } from "react";

export type ToastVariant = "default" | "destructive";

export interface Toast {
  id:          string;
  title?:      string;
  description?: string;
  variant?:    ToastVariant;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let memoryState: Toast[] = [];

function dispatch(toast: Omit<Toast, "id">) {
  const id = Math.random().toString(36).slice(2);
  memoryState = [{ ...toast, id }, ...memoryState].slice(0, 5);
  listeners.forEach((l) => l(memoryState));

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    memoryState = memoryState.filter((t) => t.id !== id);
    listeners.forEach((l) => l(memoryState));
  }, 5000);
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState);

  useCallback(() => {
    listeners.push(setToasts);
    return () => {
      listeners = listeners.filter((l) => l !== setToasts);
    };
  }, []);

  return {
    toasts,
    toast: dispatch,
    dismiss: (id: string) => {
      memoryState = memoryState.filter((t) => t.id !== id);
      listeners.forEach((l) => l(memoryState));
    },
  };
}
