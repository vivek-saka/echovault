import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";
import { users, workspaces, workspaceMembers } from "@/lib/db/schema";
import { registerSchema } from "@/types/auth";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if email is already in use
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.email, input.email),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists.",
        });
      }

      const passwordHash = await bcrypt.hash(input.password, 12);

      // Create user + default workspace in a transaction
      return await ctx.db.transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({
            name:         input.name,
            email:        input.email,
            passwordHash,
          })
          .returning({
            id:    users.id,
            email: users.email,
            name:  users.name,
          });

        // Auto-create a personal workspace
        const [workspace] = await tx
          .insert(workspaces)
          .values({
            name:    `${input.name}'s Workspace`,
            ownerId: user.id,
          })
          .returning();

        await tx.insert(workspaceMembers).values({
          workspaceId: workspace.id,
          userId:      user.id,
          role:        "owner",
        });

        return { user, workspace };
      });
    }),
});
