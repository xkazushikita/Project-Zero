import "server-only";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { AppAgent } from "@/lib/agents/types";
import type { Lead } from "@/lib/leads/types";

export interface ResearchResult {
  summary: string;
  priorities: string[];
  hooks: string[];
  angle: string;
}

const RESEARCH_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    priorities: { type: "array", items: { type: "string" } },
    hooks: { type: "array", items: { type: "string" } },
    angle: { type: "string" },
  },
  required: ["summary", "priorities", "hooks", "angle"],
};

function fallback(lead: Lead): ResearchResult {
  return {
    summary:
      "Research brief unavailable (Gemini not configured). " +
      lead.name +
      (lead.company ? " (" + lead.company + ")" : "") +
      " looks like a fit worth a closer look.",
    priorities: [],
    hooks: [],
    angle: "Reach out with a short, genuine note about why you like the brand and how your audience overlaps.",
  };
}

// Pure: takes the acting agent, the brand, and the creator's Media Kit summary — no DB access.
export async function draftResearch(agent: AppAgent, lead: Lead, creatorContext: string): Promise<ResearchResult> {
  if (!isGeminiConfigured()) return fallback(lead);

  const system = [
    "You are " + agent.name + ", an internal research assistant preparing a brand-outreach strategy for a content creator.",
    "Based only on the facts given below (plus general knowledge of the brand if you recognize it), work out: what the brand likely sells, who its audience is, and what its marketing style/recent campaigns tend to look like.",
    "Then write a personalized pitch strategy: a short summary, 3-5 priorities the brand likely cares about, 3-5 concrete talking-point hooks the creator could use in outreach, and a one-sentence collaboration angle/idea.",
    "Never invent specific claims, numbers, or named campaigns you weren't told about and aren't confident of — keep things plausible and general if the facts are thin. This brief is for the creator's own eyes, not sent to the brand.",
    "Here is the creator this strategy is for:",
    creatorContext || "(No Media Kit on file yet — keep the strategy generic.)",
    "Return ONLY JSON matching the schema.",
  ].join("\n");

  const turns = [
    {
      role: "user" as const,
      text: [
        "Brand: " + lead.name,
        lead.company ? "Company: " + lead.company : "",
        lead.platform ? "Platform/profile: " + lead.platform : "",
        lead.email ? "Contact email on file: " + lead.email : "",
      ]
        .filter(Boolean)
        .join("\n"),
    },
  ];

  try {
    const result = await geminiJSON<ResearchResult>(system, turns, RESEARCH_SCHEMA, { maxTokens: 2048, temperature: 0.6 });
    const fb = fallback(lead);
    return {
      summary: result.summary?.trim() || fb.summary,
      priorities: Array.isArray(result.priorities) ? result.priorities : [],
      hooks: Array.isArray(result.hooks) ? result.hooks : [],
      angle: result.angle?.trim() || fb.angle,
    };
  } catch {
    return fallback(lead);
  }
}
