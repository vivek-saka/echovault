"use client";

import { useState }   from "react";
import { formatDistanceToNow, format } from "date-fns";
import { History, ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { api }        from "@/lib/trpc/client";
import { useToast }   from "@/hooks/use-toast";
import { cn }         from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface VersionHistoryProps {
  documentId: string;
  onRestore:  (content: string) => void;
}

export function VersionHistory({ documentId, onRestore }: VersionHistoryProps) {
  const [isOpen, setIsOpen]           = useState(false);
  const [selectedVersion, setSelected] = useState<string | null>(null);
  const { toast }                      = useToast();

  const { data: versions = [], isLoading } = api.documents.getVersions.useQuery(
    { documentId },
    { enabled: isOpen }
  );

  function handleRestore(content: string, versionId: string) {
    onRestore(content);
    setSelected(versionId);
    toast({ title: "Version restored", description: "The document has been restored to this version." });
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-muted-foreground" />
          Version history
        </div>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {/* Version list */}
      {isOpen && (
        <div className="border-t border-border divide-y divide-border/50 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No version history yet.
              <br />
              <span className="text-xs">Versions are saved automatically as you write.</span>
            </div>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className={cn(
                  "px-4 py-3 flex items-center justify-between gap-3 hover:bg-accent/50 transition-colors",
                  selectedVersion === version.id && "bg-vault-50 dark:bg-vault-950"
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-6 h-6 flex-shrink-0">
                    <AvatarImage src={version.author.image ?? ""} />
                    <AvatarFallback className="text-[10px] bg-vault-100 text-vault-800">
                      {(version.author.name ?? "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">
                      {version.message ?? "Auto-save"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                      {" · "}
                      {format(new Date(version.createdAt), "MMM d, h:mm a")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRestore(version.content, version.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-xs text-vault-600 hover:text-vault-700 px-2 py-1 rounded hover:bg-vault-100 dark:hover:bg-vault-900 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Restore
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
