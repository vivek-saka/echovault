"use client";

import { useState }      from "react";
import Link              from "next/link";
import { usePathname }   from "next/navigation";
import { signOut }       from "next-auth/react";
import type { Session }  from "next-auth";
import {
  Shield, Plus, ChevronDown, ChevronRight,
  FileText, Settings, LogOut, Trash2, Search,
  Home, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/trpc/client";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  user: Session["user"];
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  const { data: workspaces = [], isLoading: wsLoading } =
    api.workspaces.list.useQuery();

  const { data: documents = [], isLoading: docsLoading } =
    api.documents.list.useQuery(
      { workspaceId: activeWorkspaceId! },
      { enabled: !!activeWorkspaceId }
    );

  const utils = api.useUtils();

  const createDoc = api.documents.create.useMutation({
    onSuccess: () => utils.documents.list.invalidate(),
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createWorkspace = api.workspaces.create.useMutation({
    onSuccess: (ws) => {
      utils.workspaces.list.invalidate();
      setActiveWorkspaceId(ws.id);
    },
    onError: (e) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Auto-select first workspace
  if (workspaces.length > 0 && !activeWorkspaceId) {
    setActiveWorkspaceId(workspaces[0].id);
  }

  const initials = (user.name ?? user.email ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside
      className={cn(
        "flex flex-col h-full border-r border-border bg-background transition-all duration-200",
        collapsed ? "w-14" : "w-64"
      )}
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        {!collapsed && (
          <Link href="/workspace" className="flex items-center gap-2 hover:opacity-80">
            <div className="w-7 h-7 rounded-lg bg-vault-600 flex items-center justify-center flex-shrink-0">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-semibold text-sm tracking-tight">EchoVault</span>
          </Link>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-lg bg-vault-600 flex items-center justify-center mx-auto">
            <Shield className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors",
            collapsed && "mx-auto"
          )}
        >
          {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── Workspace Selector ───────────────────────────────────────── */}
      {!collapsed && (
        <div className="p-2 border-b border-border/50">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-sm transition-colors">
                <span className="font-medium truncate">
                  {currentWorkspace?.name ?? "Select workspace"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => setActiveWorkspaceId(ws.id)}
                  className={cn(ws.id === activeWorkspaceId && "bg-accent")}
                >
                  {ws.name}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  createWorkspace.mutate({ name: "New Workspace" })
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                New workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* ── Navigation ──────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Fixed nav items */}
        {[
          { href: "/workspace", icon: Home, label: "Home" },
          { href: "/search",    icon: Search, label: "Search" },
          { href: "/trash",     icon: Trash2, label: "Trash" },
        ].map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "sidebar-item",
              pathname === href && "active"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
          </Link>
        ))}

        {/* Documents section */}
        {!collapsed && activeWorkspaceId && (
          <div className="pt-2">
            <div className="flex items-center justify-between px-3 py-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Documents
              </span>
              <button
                onClick={() =>
                  createDoc.mutate({
                    title:       "Untitled",
                    workspaceId: activeWorkspaceId,
                  })
                }
                className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {docsLoading ? (
              <div className="space-y-1 px-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-8 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <p className="text-xs text-muted-foreground px-3 py-2">
                No documents yet.{" "}
                <button
                  onClick={() =>
                    createDoc.mutate({
                      title:       "Untitled",
                      workspaceId: activeWorkspaceId,
                    })
                  }
                  className="text-vault-600 hover:underline"
                >
                  Create one
                </button>
              </p>
            ) : (
              <div className="space-y-0.5">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/documents/${doc.id}`}
                    className={cn(
                      "sidebar-item text-sm group",
                      pathname === `/documents/${doc.id}` && "active"
                    )}
                  >
                    <span className="flex-shrink-0">{doc.emoji}</span>
                    <span className="truncate">{doc.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* ── User ─────────────────────────────────────────────────────── */}
      <div className="p-2 border-t border-border/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-colors",
                collapsed && "justify-center"
              )}
            >
              <Avatar className="w-7 h-7 flex-shrink-0">
                <AvatarImage src={user.image ?? ""} alt={user.name ?? ""} />
                <AvatarFallback className="text-xs bg-vault-100 text-vault-800">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="w-4 h-4 mr-2" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
