import { appRouter } from "@flyt-tribe/api";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { withBasePath } from "@/lib/base-path";
import { runWithRequestContext } from "@/lib/request-context";
import { createWebTRPCContext } from "@/server/trpc/context";

export const runtime = "nodejs";

const handler = (req: Request) =>
  runWithRequestContext(req, async (requestContext) => {
    const response = await fetchRequestHandler({
      endpoint: withBasePath("/api/trpc"),
      req,
      router: appRouter,
      createContext: () => createWebTRPCContext(requestContext),
    });

    response.headers.set("x-request-id", requestContext.requestId);
    response.headers.set("x-correlation-id", requestContext.correlationId);

    return response;
  });

export { handler as GET, handler as POST };
