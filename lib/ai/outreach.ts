import "server-only";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { AppAgent } from "@/lib/agents/types";
import type { Lead, OutreachDraft } from "@/lib/leads/types";

const OUTREACH_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
};

function fallback(lead: Lead): OutreachDraft {
  return {
    subject: "Partnership idea for " + lead.name,
    body:
      "Hi " +
      lead.name +
      " team,\n\nI'm a content creator and I've been a fan of what you're building. I'd love to explore a possible collaboration, my audience overlaps well with yours.\n\nOpen to a quick chat?\n\nBest,",
  };
}

// Pure: takes the acting agent, the brand, and the creator's Media Kit summary — no DB access.
export async function draftOutreach(agent: AppAgent, lead: Lead, creatorContext: string): Promise<OutreachDraft> {
  if (!isGeminiConfigured()) return fallback(lead);

  const system = [
    "You are " + agent.name + ", writing a first-touch outreach message on behalf of a content creator, pitching a brand for a paid collaboration.",
    "Write a short, warm, specific email or DM (not a template) — genuine, confident, not pushy. Reference something plausible about the brand if you have facts; otherwise keep it general rather than inventing details.",
    "Keep the body under 150 words. End with a light call to action (a quick call, or just 'let me know if you're interested').",
    lead.research
      ? "Use this pitch strategy already prepared for this brand as your guide:\nSummary: " +
        lead.research.summary +
        "\nAngle: " +
        lead.research.angle +
        "\nHooks: " +
        lead.research.hooks.join("; ")
      : "No pitch strategy has been prepared yet for this brand, so keep it general and friendly.",
    "Here is the creator this pitch is for:",
    creatorContext || "(No Media Kit on file yet — keep it generic but still personable.)",
    "Return ONLY JSON matching the schema: a short subject line, and the message body.",
  ].join("\n");

  const turns = [
    {
      role: "user" as const,
      text: ["Brand: " + lead.name, lead.company ? "Company: " + lead.company : "", lead.platform ? "Platform: " + lead.platform : ""]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  try {
    const result = await geminiJSON<OutreachDraft>(system, turns, OUTREACH_SCHEMA, { maxTokens: 1024, temperature: 0.7 });
    const fb = fallback(lead);
    return {
      subject: result.subject?.trim() || fb.subject,
      body: result.body?.trim() || fb.body,
    };
  } catch {
    return fallback(lead);
  }
}
