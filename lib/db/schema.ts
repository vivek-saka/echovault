import {
  boolean,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name:          text("name"),
  email:         text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image:         text("image"),
  passwordHash:  text("password_hash"),
  createdAt:     timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt:     timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Auth Accounts (OAuth) ────────────────────────────────────────────────────
export const accounts = pgTable(
  "accounts",
  {
    id:                uuid("id").primaryKey().defaultRandom(),
    userId:            uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type:              text("type").notNull(),
    provider:          text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refreshToken:      text("refresh_token"),
    accessToken:       text("access_token"),
    expiresAt:         text("expires_at"),
    tokenType:         text("token_type"),
    scope:             text("scope"),
    idToken:           text("id_token"),
    sessionState:      text("session_state"),
  },
  (table) => ({
    providerIdx: index("accounts_provider_idx").on(table.provider, table.providerAccountId),
    userIdx:     index("accounts_user_idx").on(table.userId),
  })
);

// ─── Auth Sessions ────────────────────────────────────────────────────────────
export const sessions = pgTable(
  "sessions",
  {
    id:           uuid("id").primaryKey().defaultRandom(),
    sessionToken: text("session_token").notNull().unique(),
    userId:       uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    expires:      timestamp("expires", { mode: "date" }).notNull(),
  },
  (table) => ({
    userIdx: index("sessions_user_idx").on(table.userId),
  })
);

// ─── Verification Tokens ──────────────────────────────────────────────────────
export const verificationTokens = pgTable("verification_tokens", {
  identifier: text("identifier").notNull(),
  token:      text("token").notNull().unique(),
  expires:    timestamp("expires", { mode: "date" }).notNull(),
});

// ─── Workspaces ───────────────────────────────────────────────────────────────
export const workspaces = pgTable("workspaces", {
  id:        uuid("id").primaryKey().defaultRandom(),
  name:      text("name").notNull(),
  ownerId:   uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});

// ─── Workspace Members ────────────────────────────────────────────────────────
export const workspaceMembers = pgTable(
  "workspace_members",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    userId:      uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    role:        text("role", { enum: ["owner", "admin", "member", "viewer"] }).notNull().default("member"),
    joinedAt:    timestamp("joined_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceUserIdx: index("workspace_members_idx").on(table.workspaceId, table.userId),
  })
);

// ─── Documents ────────────────────────────────────────────────────────────────
export const documents = pgTable(
  "documents",
  {
    id:          uuid("id").primaryKey().defaultRandom(),
    title:       text("title").notNull().default("Untitled"),
    // Encrypted content stored as base64 ciphertext — server never sees plaintext
    content:     text("content").default(""),
    // Public metadata (not encrypted)
    emoji:       text("emoji").default("📄"),
    coverImage:  text("cover_image"),
    isPublic:    boolean("is_public").default(false).notNull(),
    isArchived:  boolean("is_archived").default(false).notNull(),
    parentId:    uuid("parent_id"),
    workspaceId: uuid("workspace_id").notNull().references(() => workspaces.id, { onDelete: "cascade" }),
    authorId:    uuid("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    // Version tracking
    version:     text("version").default("1").notNull(),
    createdAt:   timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt:   timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    workspaceIdx: index("documents_workspace_idx").on(table.workspaceId),
    authorIdx:    index("documents_author_idx").on(table.authorId),
    parentIdx:    index("documents_parent_idx").on(table.parentId),
  })
);

// ─── Document Versions (Git-like history) ────────────────────────────────────
export const documentVersions = pgTable(
  "document_versions",
  {
    id:         uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    content:    text("content").notNull(),  // Encrypted snapshot
    diff:       jsonb("diff"),              // JSON diff from previous version
    message:    text("message"),            // Optional commit-style message
    authorId:   uuid("author_id").notNull().references(() => users.id),
    createdAt:  timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    documentIdx: index("document_versions_doc_idx").on(table.documentId),
  })
);

// ─── Document Collaborators ───────────────────────────────────────────────────
export const documentCollaborators = pgTable(
  "document_collaborators",
  {
    id:         uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
    userId:     uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    permission: text("permission", { enum: ["read", "comment", "edit"] }).notNull().default("read"),
    addedAt:    timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    docUserIdx: index("doc_collaborators_idx").on(table.documentId, table.userId),
  })
);

// ─── Relations ────────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  accounts:               many(accounts),
  sessions:               many(sessions),
  workspaces:             many(workspaces),
  workspaceMembers:       many(workspaceMembers),
  documents:              many(documents),
  documentCollaborators:  many(documentCollaborators),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner:   one(users, { fields: [workspaces.ownerId], references: [users.id] }),
  members: many(workspaceMembers),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  workspace:     one(workspaces, { fields: [documents.workspaceId], references: [workspaces.id] }),
  author:        one(users, { fields: [documents.authorId], references: [users.id] }),
  parent:        one(documents, { fields: [documents.parentId], references: [documents.id], relationName: "parent" }),
  children:      many(documents, { relationName: "parent" }),
  versions:      many(documentVersions),
  collaborators: many(documentCollaborators),
}));

// ─── Type Exports ─────────────────────────────────────────────────────────────
export type User              = typeof users.$inferSelect;
export type NewUser           = typeof users.$inferInsert;
export type Workspace         = typeof workspaces.$inferSelect;
export type NewWorkspace      = typeof workspaces.$inferInsert;
export type Document          = typeof documents.$inferSelect;
export type NewDocument       = typeof documents.$inferInsert;
export type DocumentVersion   = typeof documentVersions.$inferSelect;
export type DocumentCollaborator = typeof documentCollaborators.$inferSelect;
