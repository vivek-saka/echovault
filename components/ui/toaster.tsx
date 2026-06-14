"use client";

import { useToast } from "@/hooks/use-toast";
import { X }        from "lucide-react";
import { cn }       from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg animate-fade-in",
            toast.variant === "destructive"
              ? "bg-destructive text-destructive-foreground border-destructive/20"
              : "bg-background border-border"
          )}
        >
          <div className="flex-1 min-w-0">
            {toast.title && (
              <p className="text-sm font-medium">{toast.title}</p>
            )}
            {toast.description && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
