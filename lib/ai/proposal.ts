import "server-only";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { AppAgent } from "@/lib/agents/types";
import type { Lead, ProposalDraft } from "@/lib/leads/types";

const PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
    price: { type: "number" },
  },
  required: ["subject", "body", "price"],
};

function fallback(lead: Lead, rateFloor: number | null): ProposalDraft {
  const price = rateFloor ?? 500;
  return {
    subject: "Proposal for " + lead.name,
    body:
      "Hi " +
      lead.name +
      " team,\n\nThanks for the interest! Here's what I'm proposing: one dedicated piece of content built around your brand, delivered with a content brief for your approval before it goes live.\n\nInvestment: $" +
      price +
      "\n\nHappy to adjust scope to fit your goals, let me know what works.\n\nBest,",
    price,
  };
}

// Pure: takes the acting agent, the brand, the creator's Media Kit summary, and their rate floor — no DB access.
export async function draftProposal(agent: AppAgent, lead: Lead, creatorContext: string, rateFloor: number | null): Promise<ProposalDraft> {
  if (!isGeminiConfigured()) return fallback(lead, rateFloor);

  const system = [
    "You are " + agent.name + ", writing a priced sponsorship proposal on behalf of a content creator, for a brand that has already shown interest.",
    "Write a short, professional proposal: what's included (e.g. one piece of dedicated content, usage rights, a revision round), and a single all-in price.",
    rateFloor
      ? "The creator's rate floor is $" + rateFloor + " — never price below this. Price at or above it based on what seems reasonable for the scope."
      : "No rate floor is on file — pick a reasonable, modest price for a single creator collaboration (typically $300 to $1500) based on the scope you propose.",
    lead.research ? "Pitch strategy already prepared for this brand: " + lead.research.summary : "",
    "Here is the creator this proposal is for:",
    creatorContext || "(No Media Kit on file yet — keep the scope generic.)",
    "Return ONLY JSON matching the schema: a short subject line, the proposal body (mention the price within the body text too), and price as a plain number (no currency symbol, no commas).",
  ]
    .filter(Boolean)
    .join("\n");

  const turns = [
    {
      role: "user" as const,
      text: ["Brand: " + lead.name, lead.company ? "Company: " + lead.company : ""].filter(Boolean).join("\n"),
    },
  ];

  try {
    const result = await geminiJSON<ProposalDraft>(system, turns, PROPOSAL_SCHEMA, { maxTokens: 1024, temperature: 0.6 });
    const fb = fallback(lead, rateFloor);
    const price = typeof result.price === "number" && result.price > 0 ? result.price : fb.price;
    return {
      subject: result.subject?.trim() || fb.subject,
      body: result.body?.trim() || fb.body,
      price,
    };
  } catch {
    return fallback(lead, rateFloor);
  }
}
