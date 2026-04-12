import { createDrizzle } from "@/db";
import { createFileRoute } from "@tanstack/react-router";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";
import { canAccessBlob, canAccessPublicBlob } from "../../db/queries";
import { blobs } from "../../db/schema";
import { createAuth } from "../../lib/auth";
import { logger } from "../../lib/logger";
import { getRequestContext } from "../../lib/request-context";

type BlobAccessResult = { authorized: true; mediaType: string } | { authorized: false; response: Response };

async function checkBlobAccess(request: Request, sha256: string, reqCtx: any): Promise<BlobAccessResult> {
  const db = createDrizzle(env.DB);
  const auth = createAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  let hasAccess = false;
  const userId = session?.user?.id ?? "anonymous";
  reqCtx.userId = userId;
  reqCtx.sha256 = sha256.slice(0, 8);
  if (session?.user) {
    hasAccess = await canAccessBlob(db, session.user.id, sha256);
  } else {
    hasAccess = await canAccessPublicBlob(db, sha256);
  }
  if (!hasAccess) {
    logger.warn("Blob access denied", { sha256: sha256.slice(0, 8), userId: reqCtx.userId }, reqCtx);
    return { authorized: false, response: new Response(null, { status: 404 }) };
  }
  // Get media type from blobs table
  const blobRecord = await db
    .select({ mediaType: blobs.mediaType })
    .from(blobs)
    .where(eq(blobs.sha256, sha256))
    .limit(1);
  if (!blobRecord.length) {
    logger.warn("Blob metadata not found", { sha256: sha256.slice(0, 8) }, reqCtx);
    return { authorized: false, response: new Response(null, { status: 404 }) };
  }
  reqCtx.mediaType = blobRecord[0].mediaType;
  return { authorized: true, mediaType: blobRecord[0].mediaType };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const Route = createFileRoute("/api/blobs/$sha256" as any)({
  server: {
    handlers: {
      HEAD: async ({ request, params }: { request: Request; params: { sha256: string } }) => {
        const { sha256 } = params;
        const reqCtx = getRequestContext(request);
        reqCtx.sha256 = sha256.slice(0, 8);
        logger.debug("Blob HEAD request received", { sha256: sha256.slice(0, 8) }, reqCtx);
        const accessResult = await checkBlobAccess(request, sha256, reqCtx);
        if (!accessResult.authorized) {
          return accessResult.response;
        }
        const object = await env.BUCKET.head(`blobs/${sha256}`);
        if (!object) {
          return new Response(null, { status: 404 });
        }
        return new Response(null, {
          status: 200,
          headers: {
            ETag: sha256,
            "Content-Length": String(object.size),
          },
        });
      },
      GET: async ({ request, params }: { request: Request; params: { sha256: string } }) => {
        const { sha256 } = params;
        const reqCtx = getRequestContext(request);
        reqCtx.sha256 = sha256.slice(0, 8);
        logger.debug("Blob GET request received", { sha256: sha256.slice(0, 8) }, reqCtx);
        const accessResult = await checkBlobAccess(request, sha256, reqCtx);
        if (!accessResult.authorized) {
          return accessResult.response;
        }
        const object = await env.BUCKET.get(`blobs/${sha256}`);
        if (!object) {
          logger.warn("Blob not found in R2", { sha256: sha256.slice(0, 8) }, reqCtx);
          return new Response("Not found", { status: 404 });
        }
        logger.debug("Serving blob", { sha256: sha256.slice(0, 8), mediaType: accessResult.mediaType }, reqCtx);
        return new Response(object.body, {
          headers: {
            "Content-Type": accessResult.mediaType,
            "Cache-Control": "private, max-age=31536000, immutable",
            ETag: sha256,
          },
        });
      },
    },
  },
});
