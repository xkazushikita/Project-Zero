import "server-only";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { AppAgent } from "@/lib/agents/types";
import type { Lead, FollowUpDraft } from "@/lib/leads/types";

const FOLLOWUP_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
};

function fallback(lead: Lead): FollowUpDraft {
  return {
    subject: "Following up, " + lead.name,
    body:
      "Hi again " +
      lead.name +
      " team,\n\nJust circling back on my note, I know things get busy! Still very interested in working together if the timing's right.\n\nHappy to answer any questions.\n\nBest,",
  };
}

// Pure: takes the acting agent, the brand, and the creator's Media Kit summary — no DB access.
export async function draftFollowUp(agent: AppAgent, lead: Lead, creatorContext: string): Promise<FollowUpDraft> {
  if (!isGeminiConfigured()) return fallback(lead);

  const system = [
    "You are " + agent.name + ", writing a short follow-up nudge on behalf of a content creator, to a brand that went quiet after earlier contact.",
    "Keep it brief (under 80 words), warm, and low-pressure, never guilt-trip or sound impatient. Build on what was said before if given.",
    lead.outreach
      ? "The original outreach message sent was:\nSubject: " + lead.outreach.subject + "\n" + lead.outreach.body
      : "No earlier outreach message is on file, so write a general check-in as if a first note was sent a while ago.",
    "Here is the creator this follow-up is for:",
    creatorContext || "(No Media Kit on file yet.)",
    "Return ONLY JSON matching the schema: a short subject line, and the message body.",
  ].join("\n");

  const turns = [
    {
      role: "user" as const,
      text: "Brand: " + lead.name,
    },
  ];

  try {
    const result = await geminiJSON<FollowUpDraft>(system, turns, FOLLOWUP_SCHEMA, { maxTokens: 768, temperature: 0.7 });
    const fb = fallback(lead);
    return {
      subject: result.subject?.trim() || fb.subject,
      body: result.body?.trim() || fb.body,
    };
  } catch {
    return fallback(lead);
  }
}
