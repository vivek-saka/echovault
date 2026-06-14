import { redirect } from "next/navigation";
import Link          from "next/link";
import { auth }      from "@/lib/auth";
import { Shield, FileText, Users, Lock, ArrowRight, Zap } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  // Redirect authenticated users to their dashboard
  if (session?.user) {
    redirect("/workspace");
  }

  return (
    <main className="min-h-screen bg-background">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-vault-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg tracking-tight">EchoVault</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-sm bg-vault-600 hover:bg-vault-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-vault-50 dark:bg-vault-950 text-vault-700 dark:text-vault-300 text-sm px-4 py-2 rounded-full border border-vault-200 dark:border-vault-800 mb-8">
            <Lock className="w-3.5 h-3.5" />
            End-to-end encrypted · Your keys, your data
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Where ideas live{" "}
            <span className="text-vault-600">in private</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            A collaborative knowledge base that encrypts your content client-side.
            The server stores ciphertext — only you hold the keys.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-vault-600 hover:bg-vault-700 text-white px-6 py-3 rounded-xl font-medium transition-colors text-base"
            >
              Start for free <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="https://github.com/your-username/echovault"
              target="_blank"
              className="inline-flex items-center gap-2 border border-border hover:bg-accent px-6 py-3 rounded-xl font-medium transition-colors text-base"
            >
              View on GitHub
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16 tracking-tight">
            Built for privacy without compromising power
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Zero-knowledge encryption",
                desc:  "WebCrypto AES-256-GCM encrypts your content before it leaves your browser. We never see your notes.",
                color: "text-vault-600",
                bg:    "bg-vault-50 dark:bg-vault-950",
              },
              {
                icon: FileText,
                title: "Rich text editor",
                desc:  "Tiptap-powered editor with headings, code blocks, task lists, images, and markdown shortcuts.",
                color: "text-emerald-600",
                bg:    "bg-emerald-50 dark:bg-emerald-950",
              },
              {
                icon: Users,
                title: "Team collaboration",
                desc:  "Share workspaces with your team. Fine-grained permissions: owner, admin, member, or viewer.",
                color: "text-blue-600",
                bg:    "bg-blue-50 dark:bg-blue-950",
              },
              {
                icon: Zap,
                title: "Version history",
                desc:  "Every save creates a version snapshot. Browse your document's full history and restore any point.",
                color: "text-amber-600",
                bg:    "bg-amber-50 dark:bg-amber-950",
              },
              {
                icon: Shield,
                title: "Type-safe stack",
                desc:  "Built with tRPC + Drizzle ORM. End-to-end type safety from the database schema to the React component.",
                color: "text-purple-600",
                bg:    "bg-purple-50 dark:bg-purple-950",
              },
              {
                icon: FileText,
                title: "Nested documents",
                desc:  "Organize your knowledge in hierarchical trees. Infinite nesting with breadcrumb navigation.",
                color: "text-rose-600",
                bg:    "bg-rose-50 dark:bg-rose-950",
              },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="p-6 rounded-2xl border border-border hover:border-border/80 transition-colors group">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Your vault awaits</h2>
          <p className="text-muted-foreground mb-8">
            Free forever for personal use. Open source.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-vault-600 hover:bg-vault-700 text-white px-8 py-4 rounded-xl font-medium transition-colors text-base"
          >
            Create your vault <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-vault-600" />
            <span>EchoVault — Open source & privacy-first</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="https://github.com/your-username/echovault" className="hover:text-foreground transition-colors">
              GitHub
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
