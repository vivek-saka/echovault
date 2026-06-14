"use client";

import { useState, useEffect } from "react";
import { api }                 from "@/lib/trpc/client";
import { useToast }            from "@/hooks/use-toast";

const ACTIVE_WS_KEY = "echovault:activeWorkspace";

export function useWorkspace() {
  const { toast } = useToast();
  const utils = api.useUtils();

  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACTIVE_WS_KEY);
  });

  const { data: workspaces = [], isLoading } = api.workspaces.list.useQuery();

  // Auto-select first workspace if none stored
  useEffect(() => {
    if (!activeId && workspaces.length > 0) {
      const firstId = workspaces[0].id;
      setActiveId(firstId);
      localStorage.setItem(ACTIVE_WS_KEY, firstId);
    }
  }, [workspaces, activeId]);

  function switchWorkspace(id: string) {
    setActiveId(id);
    localStorage.setItem(ACTIVE_WS_KEY, id);
  }

  const createWorkspace = api.workspaces.create.useMutation({
    onSuccess: (ws) => {
      utils.workspaces.list.invalidate();
      switchWorkspace(ws.id);
      toast({ title: `"${ws.name}" created` });
    },
    onError: (e) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const activeWorkspace = workspaces.find((w) => w.id === activeId);

  return {
    workspaces,
    activeWorkspace,
    activeId,
    isLoading,
    switchWorkspace,
    createWorkspace: (name: string) => createWorkspace.mutate({ name }),
    isCreating:      createWorkspace.isPending,
  };
}
