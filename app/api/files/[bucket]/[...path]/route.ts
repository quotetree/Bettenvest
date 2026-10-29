import { contentTypeFor, isBucket, safeObjectPath } from "@/lib/files";
import { readBytes } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ bucket: string; path: string[] }> },
) {
  const params = await context.params;
  if (!isBucket(params.bucket)) return new Response("Not found", { status: 404 });
  const objectPath = safeObjectPath(params.path.map((part) => decodeURIComponent(part)).join("/"));
  if (!objectPath) return new Response("Not found", { status: 404 });
  const bytes = await readBytes(params.bucket, objectPath);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": contentTypeFor(objectPath),
      "Cache-Control": "public, max-age=3600",
    },
  });
}
