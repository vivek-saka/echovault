import { createTRPCRouter } from "@/server/trpc";
import { authRouter }       from "@/server/routers/auth";
import { documentsRouter }  from "@/server/routers/documents";
import { workspacesRouter } from "@/server/routers/workspaces";

/**
 * The main application router.
 * All tRPC procedures are nested under their respective sub-routers.
 *
 * Usage from client:
 *   api.documents.list.useQuery(...)
 *   api.workspaces.create.useMutation(...)
 */
export const appRouter = createTRPCRouter({
  auth:       authRouter,
  documents:  documentsRouter,
  workspaces: workspacesRouter,
});

export type AppRouter = typeof appRouter;
