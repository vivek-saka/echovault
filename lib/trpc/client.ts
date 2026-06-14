"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/root";

/**
 * The tRPC React client. Import `api` anywhere in your client components.
 *
 * Example:
 *   const { data } = api.documents.list.useQuery({ workspaceId });
 */
export const api = createTRPCReact<AppRouter>();
