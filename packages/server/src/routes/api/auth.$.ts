import { createFileRoute } from "@tanstack/react-router";
import { createAuth } from "../../lib/auth";
import { logger } from "../../lib/logger";
import { getRequestContext } from "../../lib/request-context";

// Catch-all route for BetterAuth endpoints (/api/auth/*)
export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const ctx = getRequestContext(request);
        logger.info("Incoming GET /api/auth/*", {}, ctx);
        try {
          const auth = createAuth();
          return await auth.handler(request);
        } catch (error) {
          logger.error(
            "Error in GET /api/auth/*: " + (error instanceof Error ? error.message : String(error)),
            { stack: error instanceof Error ? error.stack : undefined },
            ctx,
          );
          throw error;
        }
      },
      POST: async ({ request }) => {
        const ctx = getRequestContext(request);
        logger.info("Incoming POST /api/auth/*", {}, ctx);
        try {
          const auth = createAuth();
          return await auth.handler(request);
        } catch (error) {
          logger.error(
            "Error in POST /api/auth/*: " + (error instanceof Error ? error.message : String(error)),
            { stack: error instanceof Error ? error.stack : undefined },
            ctx,
          );
          throw error;
        }
      },
    },
  },
});
