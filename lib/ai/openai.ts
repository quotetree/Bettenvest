import "server-only";

import OpenAI from "openai";

export function aiConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

function client() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  return new OpenAI({ apiKey: key, timeout: 90_000 });
}

export function parseModelJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    }
  }
  throw new Error("The model response was not JSON");
}

export async function jsonCompletion(
  system: string,
  user: string,
  images: string[] = [],
): Promise<Record<string, unknown> | null> {
  const openai = client();
  if (!openai) return null;
  const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
    { type: "text", text: user.slice(0, 24000) },
  ];
  images.slice(0, 4).forEach((url) => {
    content.push({ type: "image_url", image_url: { url, detail: "low" } });
  });
  const response = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o",
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content },
    ],
  });
  const text = response.choices[0]?.message?.content ?? "";
  if (!text) throw new Error("The model returned an empty response");
  return parseModelJson(text);
}
