/**
 * Upload checks (PRD 5.4). The declared type is not trusted: the first bytes
 * must match a PDF, JPEG or PNG signature.
 */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export type EvidenceMime = "application/pdf" | "image/jpeg" | "image/png";

const SIGNATURES: [EvidenceMime, number[]][] = [
  ["application/pdf", [0x25, 0x50, 0x44, 0x46, 0x2d]], // %PDF-
  ["image/jpeg", [0xff, 0xd8, 0xff]],
  ["image/png", [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
];

export function sniff(bytes: Uint8Array): EvidenceMime | null {
  for (const [mime, sig] of SIGNATURES) {
    if (sig.every((b, i) => bytes[i] === b)) return mime;
  }
  return null;
}

export type UploadCheck =
  | { ok: true; mime: EvidenceMime }
  | { ok: false; reason: "empty" | "too_large" | "unsupported" | "mismatch" };

export function checkUpload(bytes: Uint8Array, declared: string): UploadCheck {
  if (bytes.length === 0) return { ok: false, reason: "empty" };
  if (bytes.length > MAX_UPLOAD_BYTES) return { ok: false, reason: "too_large" };
  const mime = sniff(bytes);
  if (!mime) return { ok: false, reason: "unsupported" };
  const claimed = declared.split(";")[0]?.trim().toLowerCase();
  const same = claimed === mime || (claimed === "image/jpg" && mime === "image/jpeg");
  if (claimed && claimed !== "application/octet-stream" && !same)
    return { ok: false, reason: "mismatch" };
  return { ok: true, mime };
}

/** A filename safe to store and show: no paths, no control characters. */
export function safeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document";
  const cleaned = base
    .replace(/[^\w.\- ]+/g, "_")
    .trim()
    .slice(0, 120);
  return cleaned || "document";
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
