# 🔒 EchoVault

**A privacy-first, end-to-end encrypted collaborative knowledge base.**

Built with Next.js 15 · tRPC · PostgreSQL · Drizzle ORM · Tiptap · WebCrypto API

> The server **never** sees your plaintext content. Everything is encrypted in your browser before it leaves your device.

---

## 📁 Project Structure

```
echovault/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/                   # Login & Register pages
│   ├── (dashboard)/              # Protected workspace pages
│   │   ├── workspace/            # Home overview
│   │   ├── documents/[id]/       # Document editor
│   │   ├── search/               # Search documents
│   │   ├── settings/             # User settings
│   │   └── trash/                # Archived documents
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth handler
│   │   └── trpc/[trpc]/          # tRPC handler
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── ui/                       # Avatar, Dropdown, Toaster
│   ├── editor/                   # Tiptap editor, version history, encryption badge
│   └── collaboration/            # Sidebar, workspace overview
├── hooks/                        # use-document, use-workspace, use-toast
├── lib/
│   ├── auth.ts                   # NextAuth v5 config
│   ├── db/                       # Drizzle client + schema
│   ├── encryption/               # WebCrypto AES-256-GCM helpers
│   ├── trpc/                     # tRPC client + provider
│   ├── redis.ts                  # Redis client + rate limiting
│   ├── offline-storage.ts        # IndexedDB offline cache
│   └── utils.ts                  # cn(), timeAgo(), debounce()
├── server/
│   ├── trpc.ts                   # tRPC context + middleware
│   ├── root.ts                   # App router (combines all sub-routers)
│   └── routers/
│       ├── auth.ts               # Register procedure
│       ├── documents.ts          # Full document CRUD + search + versioning
│       └── workspaces.ts         # Workspace CRUD + membership
├── types/
│   └── auth.ts                   # Zod schemas + TypeScript types
├── middleware.ts                 # Route protection
├── docker-compose.yml            # Postgres + Redis for local dev
├── Dockerfile                    # Production container
└── drizzle.config.ts             # Drizzle ORM config
```

---

## ⚙️ Prerequisites

Make sure the following are installed on your machine:

| Tool       | Version   | Download |
|------------|-----------|----------|
| Node.js    | ≥ 20.x    | https://nodejs.org |
| npm        | ≥ 10.x    | Comes with Node.js |
| Docker     | latest    | https://docker.com |
| Git        | latest    | https://git-scm.com |
| VS Code    | latest    | https://code.visualstudio.com |

Check your versions:
```bash
node -v      # should show v20.x.x or higher
npm -v       # should show 10.x.x
docker -v    # should show Docker version 24+
git --version
```

---

## 🚀 Step-by-Step Setup (Run Locally in VS Code)

### Step 1 — Clone or copy the project

If you used the generated files, skip cloning. Just open the folder in VS Code:
```bash
# Open VS Code in the project folder
code echovault
```

Or if pushing to GitHub first:
```bash
git init
git add .
git commit -m "Initial EchoVault scaffold"
git remote add origin https://github.com/YOUR_USERNAME/echovault.git
git push -u origin main
```

---

### Step 2 — Install dependencies

Open the VS Code integrated terminal (`Ctrl + \``) and run:

```bash
npm install
```

This installs all packages from `package.json` including:
- Next.js 15, React 18, TypeScript
- tRPC v11 + TanStack Query
- Drizzle ORM + postgres driver
- NextAuth v5
- Tiptap editor
- Tailwind CSS + shadcn/ui
- bcryptjs, zod, superjson, nanoid, idb, ioredis

---

### Step 3 — Install missing peer packages

These are required but not in package.json yet (install once):

```bash
npm install @hookform/resolvers react-hook-form @tanstack/react-query
```

---

### Step 4 — Start the database and Redis with Docker

```bash
# Start Postgres (port 5432) and Redis (port 6379)
docker compose up -d
```

Verify they are running:
```bash
docker compose ps
```

You should see both `echovault_postgres` and `echovault_redis` with status `healthy`.

To stop them later:
```bash
docker compose down
```

To view logs:
```bash
docker compose logs -f postgres
docker compose logs -f redis
```

---

### Step 5 — Configure environment variables

The `.env.local` file is already created. Open it and verify:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/echovault"
AUTH_SECRET="your-super-secret-key-change-in-production"
REDIS_URL="redis://localhost:6379"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
```

For GitHub/Google OAuth (optional for now):
1. Go to https://github.com/settings/developers → New OAuth App
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `http://localhost:3000/api/auth/callback/github`
2. Copy Client ID and Secret into `.env.local`

---

### Step 6 — Generate and run the database migration

```bash
# Generate SQL migration files from your schema
npm run db:generate

# Push the schema directly to your local database
npm run db:push
```

You should see output like:
```
[✓] Changes applied
```

To open Drizzle Studio (visual DB browser):
```bash
npm run db:studio
# Opens at https://local.drizzle.studio
```

---

### Step 7 — Run the development server

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

You should see the EchoVault landing page.

---

### Step 8 — Create your first account

1. Click **"Get started free"** or go to `http://localhost:3000/register`
2. Enter your name, email, and a strong password (min 8 chars, 1 uppercase, 1 number)
3. You will be redirected to your workspace at `/workspace`
4. Click **"New document"** to open the editor

---

## 🛠️ VS Code Recommended Extensions

Install these for the best development experience:

```
Prisma (for schema highlighting)        → Prisma.prisma
Tailwind CSS IntelliSense               → bradlc.vscode-tailwindcss
ESLint                                  → dbaeumer.vscode-eslint
Prettier - Code formatter               → esbenp.prettier-vscode
TypeScript Vue Plugin / TS Hero         → antfu.vite
Auto Rename Tag                         → formulahendry.auto-rename-tag
```

Or install all at once from terminal:
```bash
code --install-extension bradlc.vscode-tailwindcss
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
```

---

## 📜 All Available NPM Commands

| Command              | Description |
|----------------------|-------------|
| `npm run dev`        | Start Next.js dev server on port 3000 |
| `npm run build`      | Build production bundle |
| `npm run start`      | Run production build |
| `npm run lint`       | Run ESLint checks |
| `npm run db:generate`| Generate Drizzle migration files |
| `npm run db:push`    | Push schema changes to DB (dev only) |
| `npm run db:migrate` | Run migrations (production) |
| `npm run db:studio`  | Open Drizzle Studio visual DB browser |

---

## 🏗️ Tech Stack Summary

| Layer         | Technology |
|---------------|------------|
| Framework     | Next.js 15 (App Router) |
| Language      | TypeScript (strict mode) |
| Styling       | Tailwind CSS + shadcn/ui |
| API           | tRPC v11 (end-to-end type-safe) |
| Auth          | NextAuth v5 + Drizzle adapter |
| Database      | PostgreSQL 16 |
| ORM           | Drizzle ORM |
| Cache/Rate    | Redis (ioredis) |
| Editor        | Tiptap (rich text, extensible) |
| Encryption    | WebCrypto API — AES-256-GCM + PBKDF2 |
| Offline       | IndexedDB via idb |
| Validation    | Zod |
| State         | TanStack Query (via tRPC) |
| Container     | Docker + Docker Compose |

---

## ☁️ Deploying to Production

### Frontend → Vercel (free tier)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# DATABASE_URL, AUTH_SECRET, REDIS_URL, NEXTAUTH_URL, etc.
```

### Backend DB → Render / Railway

**Option A — Railway (easiest):**
1. Go to https://railway.app → New Project → PostgreSQL
2. Copy the `DATABASE_URL` from Railway dashboard into Vercel env vars
3. Add a Redis service the same way

**Option B — Render:**
1. Go to https://render.com → New → PostgreSQL
2. Copy the internal database URL into your env vars

### Run migrations in production:
```bash
DATABASE_URL="your-production-url" npm run db:migrate
```

---

## 🔒 Encryption Architecture

```
User types content
      ↓
WebCrypto API (browser)
      ↓
PBKDF2 key derivation (310,000 iterations, SHA-256)
      ↓
AES-256-GCM encryption
      ↓
base64(salt[16] + iv[12] + ciphertext) → stored in DB
```

**The server only ever stores encrypted ciphertext. Even if the database is breached, the attacker sees only random bytes.**

---

## 🐛 Troubleshooting

| Problem | Fix |
|---------|-----|
| `DATABASE_URL not set` | Check `.env.local` exists and has the correct URL |
| `Connection refused :5432` | Run `docker compose up -d` and wait for healthy status |
| `Cannot find module` | Run `npm install` again |
| Port 3000 already in use | Run `npx kill-port 3000` then `npm run dev` |
| Drizzle push fails | Make sure Docker Postgres is running and DATABASE_URL matches |
| `AUTH_SECRET` error | Add any random 32+ char string to `.env.local` |
| Tiptap hydration mismatch | Normal in dev — disappears in production build |

---

## 📦 GitHub Repo Setup

```bash
# 1. Create repo on GitHub named: echovault
# 2. Push your code:
git init
git add .
git commit -m "feat: initial EchoVault scaffold — auth, editor, tRPC, encryption"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/echovault.git
git push -u origin main
```

Good commit message conventions to use:
- `feat:` new feature
- `fix:` bug fix
- `chore:` config, deps
- `docs:` README updates

---

## 🗺️ What to Build Next (Phase 2)

- [ ] Real-time collaboration with Liveblocks or Socket.io
- [ ] Workspace member invitations (email)
- [ ] Document sharing with public links
- [ ] Image uploads (Cloudflare R2 / S3)
- [ ] Full-text search with pg_trgm
- [ ] Dark mode toggle
- [ ] Mobile responsive sidebar
- [ ] Export to Markdown / PDF

---

Built by Vivek Saka · SRKR Engineering College · 2024
