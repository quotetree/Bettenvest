export const BUCKETS = ["mls-pdfs", "comp-pdfs", "property-photos"] as const;
export type Bucket = (typeof BUCKETS)[number];

export function isBucket(value: string): value is Bucket {
  return (BUCKETS as readonly string[]).includes(value);
}

export function contentTypeFor(objectPath: string): string {
  const extension = objectPath.split(".").pop()?.toLowerCase();
  switch (extension) {
    case "pdf":
      return "application/pdf";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "webp":
      return "image/webp";
    case "gif":
      return "image/gif";
    default:
      return "application/octet-stream";
  }
}

export function safeObjectPath(objectPath: string): string | null {
  if (!objectPath || objectPath.includes("..") || objectPath.startsWith("/")) return null;
  return objectPath;
}
