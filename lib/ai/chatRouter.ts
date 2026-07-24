import "server-only";
import { geminiJSON, isGeminiConfigured } from "./gemini";
import type { CapabilityId } from "@/lib/agentTypes";
import type { LeadStatus } from "@/lib/leads/types";

const STAGE_IDS: LeadStatus[] = ["new", "pitched", "negotiating", "replied", "booked"];

export interface ChatIntent {
  capability: CapabilityId | "chat";
  leadName: string | null;
  // Only meaningful when capability is "book-meeting": true if the creator is
  // checking their existing calendar rather than asking to book something new.
  isCalendarQuery: boolean;
  // True when the creator is asking about their pipeline/deals (e.g. "who's pitched",
  // "what's in negotiating", "how many brands do I have"), not asking for a new task.
  isPipelineQuery: boolean;
  // Which stage they're asking about, if any — new | pitched | negotiating | replied | booked.
  stage: LeadStatus | null;
}

const SCHEMA = {
  type: "object",
  properties: {
    capability: {
      type: "string",
      enum: ["scrape", "research", "book-meeting", "outreach", "proposal", "follow-up", "chat"],
    },
    leadName: { type: "string" },
    isCalendarQuery: { type: "boolean" },
    isPipelineQuery: { type: "boolean" },
    stage: { type: "string", enum: ["new", "pitched", "negotiating", "replied", "booked"] },
  },
  required: ["capability"],
};

// Figures out what a creator is asking their team to do, from one chat message.
export async function classifyChatIntent(message: string, knownBrandNames: string[]): Promise<ChatIntent> {
  if (!isGeminiConfigured()) return heuristicClassify(message, knownBrandNames);

  const system = [
    "Classify what a content creator is asking their AI sales team to do, from one chat message.",
    "Capabilities: scrape = find/discover new brands to pitch; research = prepare a pitch strategy/brief for one specific brand already in their pipeline; book-meeting = schedule a NEW call, OR check/view their EXISTING calendar; outreach = draft a first pitch email/DM; proposal = draft a priced proposal; follow-up = write a follow-up nudge to a brand that went quiet; chat = none of the above, including questions about their existing pipeline.",
    "Their brand pipeline has five stages: new, pitched, negotiating, replied, booked. If the creator is asking about their existing pipeline/deals — e.g. \"who's pitched\", \"what's in negotiating\", \"who had X on us\", \"how many brands do I have\", \"what's new\" — set capability to \"chat\", isPipelineQuery to true, and set stage to whichever of those five stage ids they're asking about. Omit the stage field entirely if they're asking generally, not about one specific stage.",
    "If capability is book-meeting, also set isCalendarQuery to true when the creator is asking to VIEW/CHECK what's already on their calendar (e.g. \"what's on my calendar\", \"when's my next call with Acme\", \"do I have anything Tuesday\") rather than asking to book something new. Set it false when they're asking to book/schedule a new call.",
    knownBrandNames.length
      ? "If a specific brand is named that matches (or closely resembles) one of these known brands, set leadName to that exact known name: " + knownBrandNames.join(", ") + ". Otherwise leave leadName empty."
      : "There are no known brands yet, so leadName should be empty.",
    "Return ONLY JSON matching the schema.",
  ].join("\n");

  const turns = [{ role: "user" as const, text: message }];

  try {
    const result = await geminiJSON<{
      capability: CapabilityId | "chat";
      leadName?: string;
      isCalendarQuery?: boolean;
      isPipelineQuery?: boolean;
      stage?: string;
    }>(system, turns, SCHEMA, { maxTokens: 1200, temperature: 0.2 });
    const stage = STAGE_IDS.includes(result.stage as LeadStatus) ? (result.stage as LeadStatus) : null;
    return {
      capability: result.capability,
      leadName: result.leadName || null,
      isCalendarQuery: Boolean(result.isCalendarQuery),
      isPipelineQuery: Boolean(result.isPipelineQuery),
      stage,
    };
  } catch {
    return heuristicClassify(message, knownBrandNames);
  }
}

const STAGE_WORDS: Record<string, LeadStatus> = {
  new: "new",
  pitched: "pitched",
  negotiating: "negotiating",
  negotiation: "negotiating",
  replied: "replied",
  reply: "replied",
  booked: "booked",
};

function detectStage(lower: string): LeadStatus | null {
  for (const [word, stage] of Object.entries(STAGE_WORDS)) {
    if (new RegExp("\\b" + word + "\\b").test(lower)) return stage;
  }
  return null;
}

// No Gemini key? Fall back to simple keyword matching so chat still does something useful.
function heuristicClassify(message: string, knownBrandNames: string[]): ChatIntent {
  const lower = message.toLowerCase();
  const leadName = knownBrandNames.find((n) => lower.includes(n.toLowerCase())) ?? null;
  const base = { leadName, isCalendarQuery: false, isPipelineQuery: false, stage: null as LeadStatus | null };

  const stage = detectStage(lower);
  const looksLikePipelineQuestion = /\b(who|what|how many|show|list)\b/.test(lower) || /\bpipeline\b/.test(lower);
  if ((stage || /\bpipeline\b/.test(lower)) && looksLikePipelineQuestion) {
    return { capability: "chat", ...base, isPipelineQuery: true, stage };
  }

  if (/\bbook\b|\bcall\b|\bschedule\b|\bmeeting\b/.test(lower)) {
    const isCalendarQuery = /\b(what|when|show|list|do i have)\b/.test(lower) && !/\bbook\b|\bschedule\b/.test(lower);
    return { capability: "book-meeting", ...base, isCalendarQuery };
  }
  if (/\bfind\b|\bdiscover\b|\bsearch\b|\bscout\b/.test(lower)) return { capability: "scrape", ...base };
  if (/strateg|research|brief|prepare/.test(lower)) return { capability: "research", ...base };
  if (/pitch|outreach|\bemail\b|\bdm\b/.test(lower)) return { capability: "outreach", ...base };
  if (/proposal|\bprice\b|\bquote\b/.test(lower)) return { capability: "proposal", ...base };
  if (/follow.?up|nudge/.test(lower)) return { capability: "follow-up", ...base };
  return { capability: "chat", ...base };
}
