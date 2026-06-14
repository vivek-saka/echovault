"use client";

import { Shield, ShieldOff, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type EncryptionState = "encrypted" | "unencrypted" | "encrypting";

interface EncryptionBadgeProps {
  state:     EncryptionState;
  className?: string;
}

export function EncryptionBadge({ state, className }: EncryptionBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium",
        state === "encrypted" && "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800",
        state === "unencrypted" && "bg-muted text-muted-foreground border-border",
        state === "encrypting" && "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
        className
      )}
    >
      {state === "encrypted"   && <ShieldCheck className="w-3 h-3" />}
      {state === "unencrypted" && <ShieldOff   className="w-3 h-3" />}
      {state === "encrypting"  && <Shield      className="w-3 h-3 animate-pulse" />}

      {state === "encrypted"   && "End-to-end encrypted"}
      {state === "unencrypted" && "Not encrypted"}
      {state === "encrypting"  && "Encrypting…"}
    </div>
  );
}
