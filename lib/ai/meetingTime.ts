import "server-only";
import { geminiJSON, isGeminiConfigured } from "./gemini";

export type ParseMeetingResult =
  | { ok: true; title: string; whenAt: Date; whenLabel: string }
  | { ok: false; reason: "not-configured" | "rate-limited" | "failed" };

const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    isoDateTime: { type: "string" },
    whenLabel: { type: "string" },
  },
  required: ["title", "isoDateTime", "whenLabel"],
};

// Turns a plain-English scheduling request into a specific date/time.
// Never throws — callers fall back to a manual date/time field, and get an
// accurate reason so they're not told "I couldn't understand" when the real
// issue was a busy/rate-limited AI call.
export async function parseMeetingTime(text: string, brandName?: string): Promise<ParseMeetingResult> {
  if (!isGeminiConfigured() || !text.trim()) return { ok: false, reason: "not-configured" };

  const now = new Date();
  const system = [
    "You turn a short natural-language scheduling request into a specific date and time.",
    "Right now it is: " + now.toString() + ".",
    brandName ? "This call is with the brand: " + brandName + "." : "",
    "Return: title (a short label like 'Call with Acme'), isoDateTime (a specific ISO 8601 date-time, in the same timezone offset as the current time given above), and whenLabel (a short friendly display string like 'Tue, Nov 12 · 2:00 PM').",
    "If no specific time is mentioned, default to 10:00 AM. If no specific date is mentioned, default to the next weekday.",
    "Return ONLY JSON matching the schema.",
  ]
    .filter(Boolean)
    .join("\n");

  const turns = [{ role: "user" as const, text }];

  try {
    const result = await geminiJSON<{ title: string; isoDateTime: string; whenLabel: string }>(system, turns, SCHEMA, {
      maxTokens: 1500,
      temperature: 0.3,
    });
    const when = new Date(result.isoDateTime);
    if (isNaN(when.getTime())) return { ok: false, reason: "failed" };
    return {
      ok: true,
      title: result.title?.trim() || (brandName ? "Call with " + brandName : "Brand call"),
      whenAt: when,
      whenLabel: result.whenLabel?.trim() || when.toLocaleString(),
    };
  } catch (err) {
    const msg = String(err);
    if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota")) {
      return { ok: false, reason: "rate-limited" };
    }
    return { ok: false, reason: "failed" };
  }
}
