"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api }                from "@/lib/trpc/client";
import { debounce }           from "@/lib/utils";
import {
  saveDocumentOffline,
  markDocumentUnsynced,
  getPendingWrites,
  clearPendingWrite,
  isOnline,
  onOnline,
} from "@/lib/offline-storage";
import type { Document } from "@/lib/db/schema";

const AUTOSAVE_DELAY = 1500;

export function useDocument(documentId: string) {
  const utils = api.useUtils();
  const [isSaving, setIsSaving]   = useState(false);
  const [isOnlineState, setOnline] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const pendingSaveRef = useRef<{ content?: string; title?: string }>({});

  // Fetch document
  const { data: document, isLoading, error } = api.documents.getById.useQuery(
    { id: documentId },
    { retry: 1 }
  );

  // Update mutation
  const updateMutation = api.documents.update.useMutation({
    onMutate: () => setIsSaving(true),
    onSuccess: async (updated) => {
      setIsSaving(false);
      setLastSaved(new Date());
      utils.documents.getById.setData({ id: documentId }, updated);
      utils.documents.list.invalidate();

      // Persist to IndexedDB for offline access
      if (updated) {
        await saveDocumentOffline({
          id:        updated.id,
          title:     updated.title,
          content:   updated.content ?? "",
          emoji:     updated.emoji ?? "📄",
          updatedAt: updated.updatedAt,
        });
      }
    },
    onError: async (_, variables) => {
      setIsSaving(false);
      // Queue the write for later if offline
      if (!isOnline()) {
        await markDocumentUnsynced(
          documentId,
          variables.content ?? "",
          variables.title ?? ""
        );
      }
    },
  });

  // Online/offline listeners
  useEffect(() => {
    setOnline(isOnline());

    const cleanup = onOnline(async () => {
      setOnline(true);
      // Flush pending writes when we come back online
      const pending = await getPendingWrites();
      for (const write of pending) {
        try {
          await updateMutation.mutateAsync({
            id:      write.documentId,
            content: write.content,
            title:   write.title,
          });
          await clearPendingWrite(write.documentId);
        } catch {
          // Will retry next time online
        }
      }
    });

    window.addEventListener("offline", () => setOnline(false));
    return () => {
      cleanup();
      window.removeEventListener("offline", () => setOnline(false));
    };
  }, []);

  // Debounced save function
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveContent = useCallback(
    debounce((content: string) => {
      updateMutation.mutate({ id: documentId, content });
    }, AUTOSAVE_DELAY),
    [documentId]
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveTitle = useCallback(
    debounce((title: string) => {
      updateMutation.mutate({ id: documentId, title });
    }, 500),
    [documentId]
  );

  function saveNow(data: { content?: string; title?: string }) {
    setIsSaving(true);
    updateMutation.mutate({ id: documentId, ...data });
  }

  return {
    document:     document as Document | undefined,
    isLoading,
    error,
    isSaving,
    isOnline:     isOnlineState,
    lastSaved,
    saveContent,
    saveTitle,
    saveNow,
  };
}
