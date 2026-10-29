import "server-only";

import fs from "fs/promises";
import path from "path";
import { contentTypeFor, type Bucket } from "@/lib/files";
import { getServiceClient } from "@/lib/supabase/client";

const root = path.join(process.cwd(), ".data", "uploads");

export async function saveBytes(
  bucket: Bucket,
  objectPath: string,
  bytes: Uint8Array,
  contentType = contentTypeFor(objectPath),
) {
  const supabase = getServiceClient();
  if (supabase) {
    const { error } = await supabase.storage.from(bucket).upload(objectPath, Buffer.from(bytes), {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(error.message);
    return;
  }
  const full = path.join(root, bucket, objectPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, bytes);
}

export async function readBytes(bucket: Bucket, objectPath: string): Promise<Uint8Array | null> {
  const supabase = getServiceClient();
  if (supabase) {
    const { data, error } = await supabase.storage.from(bucket).download(objectPath);
    if (error || !data) return null;
    return new Uint8Array(await data.arrayBuffer());
  }
  const full = path.resolve(root, bucket, objectPath);
  if (!full.startsWith(path.resolve(root))) return null;
  try {
    return new Uint8Array(await fs.readFile(full));
  } catch {
    return null;
  }
}
