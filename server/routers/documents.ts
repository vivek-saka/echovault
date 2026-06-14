import { TRPCError } from "@trpc/server";
import { and, desc, eq, ilike, isNull } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { documents, documentVersions, workspaceMembers } from "@/lib/db/schema";
import {
  createDocumentSchema,
  updateDocumentSchema,
  deleteDocumentSchema,
} from "@/types/auth";
import { nanoid } from "nanoid";

async function assertWorkspaceAccess(
  db: Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"]["db"],
  userId: string,
  workspaceId: string,
  requiredRole: ("owner" | "admin" | "member")[] = ["owner", "admin", "member"]
) {
  const membership = await db.query.workspaceMembers.findFirst({
    where: and(
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(workspaceMembers.userId, userId)
    ),
  });
  if (!membership || !requiredRole.includes(membership.role as "owner" | "admin" | "member")) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You do not have access to this workspace." });
  }
  return membership;
}

async function getDocumentOrThrow(
  db: Parameters<Parameters<typeof protectedProcedure.query>[0]>[0]["ctx"]["db"],
  documentId: string,
  userId: string
) {
  const doc = await db.query.documents.findFirst({ where: eq(documents.id, documentId) });
  if (!doc) throw new TRPCError({ code: "NOT_FOUND", message: "Document not found." });
  if (doc.authorId !== userId) await assertWorkspaceAccess(db, userId, doc.workspaceId);
  return doc;
}

export const documentsRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid(), parentId: z.string().uuid().nullish() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceAccess(ctx.db, ctx.session.user.id, input.workspaceId);
      return ctx.db.query.documents.findMany({
        where: and(
          eq(documents.workspaceId, input.workspaceId),
          eq(documents.isArchived, false),
          input.parentId ? eq(documents.parentId, input.parentId) : isNull(documents.parentId)
        ),
        orderBy: [desc(documents.updatedAt)],
        with: { author: { columns: { id: true, name: true, image: true } } },
      });
    }),

  listArchived: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceAccess(ctx.db, ctx.session.user.id, input.workspaceId);
      return ctx.db.query.documents.findMany({
        where: and(eq(documents.workspaceId, input.workspaceId), eq(documents.isArchived, true)),
        orderBy: [desc(documents.updatedAt)],
      });
    }),

  search: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid(), query: z.string().min(2).max(100) }))
    .query(async ({ ctx, input }) => {
      await assertWorkspaceAccess(ctx.db, ctx.session.user.id, input.workspaceId);
      return ctx.db.query.documents.findMany({
        where: and(
          eq(documents.workspaceId, input.workspaceId),
          eq(documents.isArchived, false),
          ilike(documents.title, `%${input.query}%`)
        ),
        orderBy: [desc(documents.updatedAt)],
        limit: 20,
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return getDocumentOrThrow(ctx.db, input.id, ctx.session.user.id);
    }),

  create: protectedProcedure
    .input(createDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      await assertWorkspaceAccess(ctx.db, ctx.session.user.id, input.workspaceId);
      const [doc] = await ctx.db.insert(documents).values({
        title:       input.title ?? "Untitled",
        emoji:       input.emoji ?? "📄",
        workspaceId: input.workspaceId,
        authorId:    ctx.session.user.id,
        parentId:    input.parentId ?? null,
        version:     nanoid(8),
      }).returning();
      return doc;
    }),

  update: protectedProcedure
    .input(updateDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await getDocumentOrThrow(ctx.db, input.id, ctx.session.user.id);
      if (input.content && input.content !== existing.content && existing.content) {
        await ctx.db.insert(documentVersions).values({
          documentId: existing.id,
          content:    existing.content,
          authorId:   ctx.session.user.id,
          message:    `Auto-save at ${new Date().toISOString()}`,
        });
      }
      const [updated] = await ctx.db.update(documents).set({
        ...(input.title    !== undefined && { title:    input.title }),
        ...(input.content  !== undefined && { content:  input.content }),
        ...(input.emoji    !== undefined && { emoji:    input.emoji }),
        ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
        updatedAt: new Date(),
        version:   nanoid(8),
      }).where(eq(documents.id, input.id)).returning();
      return updated;
    }),

  archive: protectedProcedure
    .input(deleteDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      await getDocumentOrThrow(ctx.db, input.id, ctx.session.user.id);
      await ctx.db.update(documents).set({ isArchived: true, updatedAt: new Date() }).where(eq(documents.id, input.id));
      return { success: true };
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await getDocumentOrThrow(ctx.db, input.id, ctx.session.user.id);
      await ctx.db.update(documents).set({ isArchived: false, updatedAt: new Date() }).where(eq(documents.id, input.id));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(deleteDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      await getDocumentOrThrow(ctx.db, input.id, ctx.session.user.id);
      await ctx.db.delete(documents).where(eq(documents.id, input.id));
      return { success: true };
    }),

  getVersions: protectedProcedure
    .input(z.object({ documentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      await getDocumentOrThrow(ctx.db, input.documentId, ctx.session.user.id);
      return ctx.db.query.documentVersions.findMany({
        where:   eq(documentVersions.documentId, input.documentId),
        orderBy: [desc(documentVersions.createdAt)],
        with: { author: { columns: { id: true, name: true, image: true } } },
        limit: 50,
      });
    }),
});
