import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/trpc";
import { workspaces, workspaceMembers } from "@/lib/db/schema";
import { createWorkspaceSchema } from "@/types/auth";

export const workspacesRouter = createTRPCRouter({
  // ─── List user's workspaces ────────────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const memberships = await ctx.db.query.workspaceMembers.findMany({
      where: eq(workspaceMembers.userId, ctx.session.user.id),
      with: {
        workspace: {
          with: {
            owner: { columns: { id: true, name: true, image: true } },
          },
        },
      },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));
  }),

  // ─── Get a workspace ──────────────────────────────────────────────────────
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const workspace = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.id, input.id),
        with: {
          owner:   { columns: { id: true, name: true, image: true } },
          members: {
            with: {
              user: { columns: { id: true, name: true, image: true, email: true } },
            },
          },
        },
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Workspace not found." });
      }

      // Check membership
      const isMember = workspace.members.some(
        (m) => m.userId === ctx.session.user.id
      );
      if (!isMember) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return workspace;
    }),

  // ─── Create a workspace ───────────────────────────────────────────────────
  create: protectedProcedure
    .input(createWorkspaceSchema)
    .mutation(async ({ ctx, input }) => {
      // Create workspace + add creator as owner in a transaction
      return await ctx.db.transaction(async (tx) => {
        const [workspace] = await tx
          .insert(workspaces)
          .values({
            name:    input.name,
            ownerId: ctx.session.user.id,
          })
          .returning();

        await tx.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId:      ctx.session.user.id,
          role:        "owner",
        });

        return workspace;
      });
    }),

  // ─── Update a workspace ───────────────────────────────────────────────────
  update: protectedProcedure
    .input(z.object({ id: z.string().uuid(), name: z.string().min(2).max(80) }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.id, input.id),
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (workspace.ownerId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the owner can rename this workspace." });
      }

      const [updated] = await ctx.db
        .update(workspaces)
        .set({ name: input.name, updatedAt: new Date() })
        .where(eq(workspaces.id, input.id))
        .returning();

      return updated;
    }),

  // ─── Leave a workspace ────────────────────────────────────────────────────
  leave: protectedProcedure
    .input(z.object({ workspaceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.db.query.workspaces.findFirst({
        where: eq(workspaces.id, input.workspaceId),
      });

      if (!workspace) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (workspace.ownerId === ctx.session.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The owner cannot leave their workspace. Transfer ownership first.",
        });
      }

      await ctx.db
        .delete(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, input.workspaceId),
            eq(workspaceMembers.userId, ctx.session.user.id)
          )
        );

      return { success: true };
    }),
});
