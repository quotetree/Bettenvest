export function money(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function plainNumber(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

export function shortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });
}

export function soldDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(date.getTime())) return "—";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(2);
  return `${mm}/${dd}/${yy}`;
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 45) return `${days} day${days === 1 ? "" : "s"} ago`;
  return shortDate(iso);
}

export function bedBath(beds: number | null, baths: number | null): string {
  if (beds == null && baths == null) return "—";
  return `${beds ?? "—"}/${baths ?? "—"}`;
}

export function damCdam(dam: number | null, cdam: number | null): string {
  if (dam == null && cdam == null) return "—";
  return `${dam ?? "—"}/${cdam ?? "—"}`;
}

export function priceRange(min: number | null, max: number | null): string {
  if (min == null && max == null) return "—";
  if (min != null && max != null) return `${money(min)} – ${money(max)}`;
  if (min != null) return `${money(min)}+`;
  return `Up to ${money(max)}`;
}

export function parseNumber(value: string): number | null {
  const cleaned = value.replace(/[$,\s]/g, "");
  if (!cleaned) return null;
  const number = Number(cleaned);
  return Number.isFinite(number) ? number : null;
}

export function addressLine(street: string, city: string, state: string, zip: string): string {
  const place = [city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [street, place].filter(Boolean).join(", ");
}

export function initials(name: string, fallback = "SB"): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function slugify(street: string, city: string): string {
  const base = `${street}-${city}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${base || "property"}-${Math.random().toString(36).slice(2, 6)}`;
}

export function fileHref(bucket: string, objectPath: string): string {
  const parts = objectPath.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `/api/files/${bucket}/${parts}`;
}

export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}
