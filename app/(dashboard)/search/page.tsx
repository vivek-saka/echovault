"use client";

import { useState, useEffect }  from "react";
import Link                     from "next/link";
import { Search as SearchIcon } from "lucide-react";
import { api }                  from "@/lib/trpc/client";
import { useWorkspace }         from "@/hooks/use-workspace";
import { timeAgo, cn }          from "@/lib/utils";

export default function SearchPage() {
  const [query, setQuery]   = useState("");
  const [debouncedQ, setDQ] = useState("");
  const { activeId }        = useWorkspace();

  // Debounce the search query
  useEffect(() => {
    const t = setTimeout(() => setDQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results = [], isLoading } = api.documents.search.useQuery(
    { workspaceId: activeId ?? "", query: debouncedQ },
    { enabled: !!activeId && debouncedQ.length > 1 }
  );

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Search</h1>

      {/* Search input */}
      <div className="relative mb-8">
        <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents by title…"
          className="w-full pl-10 pr-4 py-3 border border-input rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
        />
      </div>

      {/* Results */}
      {debouncedQ.length > 1 ? (
        isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No documents found for &ldquo;{debouncedQ}&rdquo;
          </p>
        ) : (
          <div className="space-y-2">
            {results.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center gap-3 p-4 rounded-xl border border-border hover:border-vault-200 hover:bg-vault-50/30 dark:hover:bg-vault-950/30 transition-all group"
              >
                <span className="text-xl flex-shrink-0">{doc.emoji}</span>
                <div className="min-w-0">
                  <p className="font-medium group-hover:text-vault-700 transition-colors truncate">
                    {doc.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Updated {timeAgo(doc.updatedAt)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )
      ) : (
        <p className="text-center text-muted-foreground/60 text-sm py-12">
          Type at least 2 characters to search
        </p>
      )}
    </div>
  );
}
