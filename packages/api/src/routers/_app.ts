import { router, publicProcedure } from "../core/trpc";
import { z } from "zod";

export const appRouter = router({
  health: publicProcedure
    .input(z.object({ ping: z.string().optional() }).optional())
    .query(({ input }) => ({
      ok: true,
      ping: input?.ping ?? "pong",
      ts: Date.now(),
    })),
});

export type AppRouter = typeof appRouter;
