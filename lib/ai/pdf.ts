import "server-only";

import { extractText, getDocumentProxy } from "unpdf";

export async function pdfToText(bytes: Uint8Array): Promise<string> {
  const pdf = await getDocumentProxy(bytes);
  const result = await extractText(pdf, { mergePages: true });
  const text = result.text;
  if (Array.isArray(text)) return text.join("\n\n").trim();
  return String(text ?? "").trim();
}
