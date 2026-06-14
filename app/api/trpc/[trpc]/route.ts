import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { type NextRequest } from "next/server";
import { appRouter }         from "@/server/root";
import { createTRPCContext }  from "@/server/trpc";

/**
 * Next.js App Router handler for tRPC.
 * Handles both GET (subscriptions/queries) and POST (mutations).
 */
const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint:    "/api/trpc",
    req,
    router:      appRouter,
    createContext: () => createTRPCContext({ req, resHeaders: new Headers() }),
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(`tRPC error on ${path ?? "<no-path>"}:`, error);
          }
        : undefined,
  });

export { handler as GET, handler as POST };
