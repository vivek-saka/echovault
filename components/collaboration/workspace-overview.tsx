"use client";

import Link          from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Plus, FileText, Clock, Users } from "lucide-react";
import { api }       from "@/lib/trpc/client";
import { useToast }  from "@/hooks/use-toast";

interface WorkspaceOverviewProps {
  userId: string;
}

export function WorkspaceOverview({ userId: _ }: WorkspaceOverviewProps) {
  const { toast } = useToast();
  const { data: workspaces = [], isLoading } = api.workspaces.list.useQuery();
  const utils = api.useUtils();

  const firstWorkspace = workspaces[0];

  const { data: recentDocs = [] } = api.documents.list.useQuery(
    { workspaceId: firstWorkspace?.id ?? "" },
    { enabled: !!firstWorkspace }
  );

  const createDoc = api.documents.create.useMutation({
    onSuccess: (doc) => {
      utils.documents.list.invalidate();
      window.location.href = `/documents/${doc.id}`;
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-10">
      {/* ── Greeting ────────────────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-1">
          {firstWorkspace?.name ?? "Your Vault"}
        </h1>
        <p className="text-muted-foreground">
          Your encrypted knowledge base · {recentDocs.length} document
          {recentDocs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* ── Quick stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            icon: FileText,
            label: "Total documents",
            value: recentDocs.length.toString(),
            color: "text-vault-600 bg-vault-50",
          },
          {
            icon: Users,
            label: "Workspaces",
            value: workspaces.length.toString(),
            color: "text-emerald-600 bg-emerald-50",
          },
          {
            icon: Clock,
            label: "Last updated",
            value: recentDocs[0]
              ? formatDistanceToNow(new Date(recentDocs[0].updatedAt), { addSuffix: true })
              : "—",
            color: "text-amber-600 bg-amber-50",
          },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="p-4 rounded-xl border border-border">
            <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Create new / Recent docs ─────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent documents</h2>
          {firstWorkspace && (
            <button
              onClick={() =>
                createDoc.mutate({
                  title:       "Untitled",
                  workspaceId: firstWorkspace.id,
                })
              }
              className="inline-flex items-center gap-1.5 text-sm bg-vault-600 hover:bg-vault-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New document
            </button>
          )}
        </div>

        {recentDocs.length === 0 ? (
          <div className="border border-dashed border-border rounded-xl p-12 text-center">
            <FileText className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
            <h3 className="font-medium mb-1">No documents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first encrypted document to get started
            </p>
            {firstWorkspace && (
              <button
                onClick={() =>
                  createDoc.mutate({
                    title:       "My First Note",
                    workspaceId: firstWorkspace.id,
                  })
                }
                className="inline-flex items-center gap-2 bg-vault-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-vault-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create document
              </button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {recentDocs.slice(0, 8).map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="group p-4 rounded-xl border border-border hover:border-vault-200 hover:bg-vault-50/30 dark:hover:bg-vault-950/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">{doc.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium truncate group-hover:text-vault-700 transition-colors">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
