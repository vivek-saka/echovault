"use client";

import { useState }   from "react";
import Link           from "next/link";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import { api }        from "@/lib/trpc/client";
import { useToast }   from "@/hooks/use-toast";
import { timeAgo }    from "@/lib/utils";

export default function TrashPage() {
  const { toast }  = useToast();
  const utils      = api.useUtils();

  const { data: workspaces = [] } = api.workspaces.list.useQuery();
  const firstWs = workspaces[0];

  // Archived docs — we query with a special flag
  const { data: archivedDocs = [], isLoading } = api.documents.listArchived.useQuery(
    { workspaceId: firstWs?.id ?? "" },
    { enabled: !!firstWs }
  );

  const restoreMutation = api.documents.restore.useMutation({
    onSuccess: () => {
      utils.documents.listArchived.invalidate();
      utils.documents.list.invalidate();
      toast({ title: "Document restored" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = api.documents.delete.useMutation({
    onSuccess: () => {
      utils.documents.listArchived.invalidate();
      toast({ title: "Document permanently deleted" });
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="max-w-3xl mx-auto px-8 py-12">
      <div className="flex items-center gap-3 mb-8">
        <Trash2 className="w-6 h-6 text-muted-foreground" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trash</h1>
          <p className="text-sm text-muted-foreground">
            Archived documents — restore or permanently delete
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : archivedDocs.length === 0 ? (
        <div className="border border-dashed border-border rounded-xl p-16 text-center">
          <Trash2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-muted-foreground">Trash is empty</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Archived documents will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {archivedDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border hover:bg-accent/30 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xl">{doc.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium truncate">{doc.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Archived {timeAgo(doc.updatedAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => restoreMutation.mutate({ id: doc.id })}
                  disabled={restoreMutation.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
                <button
                  onClick={() => {
                    if (confirm("Permanently delete this document? This cannot be undone.")) {
                      deleteMutation.mutate({ id: doc.id });
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3" />
                  Delete forever
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
