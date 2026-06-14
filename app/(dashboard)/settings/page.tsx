import { auth }  from "@/lib/auth";
import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-8 py-12">
      <h1 className="text-2xl font-bold tracking-tight mb-1">Settings</h1>
      <p className="text-muted-foreground mb-8">Manage your account and preferences</p>

      <div className="space-y-6">
        {/* Profile */}
        <section className="p-6 rounded-xl border border-border">
          <h2 className="font-semibold mb-4">Profile</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{session.user.name ?? "—"}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium">{session.user.email}</span>
            </div>
          </div>
        </section>

        {/* Encryption */}
        <section className="p-6 rounded-xl border border-border">
          <h2 className="font-semibold mb-2">Encryption</h2>
          <p className="text-sm text-muted-foreground mb-4">
            EchoVault uses AES-256-GCM encryption with keys derived from your password
            via PBKDF2 (310,000 iterations). The server never receives your plaintext content.
          </p>
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground font-mono">
            Algorithm: AES-256-GCM · KDF: PBKDF2-SHA256 · Iterations: 310,000
          </div>
        </section>

        {/* Danger zone */}
        <section className="p-6 rounded-xl border border-destructive/30">
          <h2 className="font-semibold text-destructive mb-2">Danger Zone</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, all your documents and workspaces are permanently removed.
            This action cannot be undone.
          </p>
          <button className="text-sm text-destructive border border-destructive/30 px-4 py-2 rounded-lg hover:bg-destructive/10 transition-colors">
            Delete account
          </button>
        </section>
      </div>
    </div>
  );
}
