import "server-only";
import { getMyProfile } from "@/lib/profile/store";
import { isFirecrawlConfigured, searchWeb } from "./firecrawl";
import { extractBrandCandidates, type BrandCandidate } from "@/lib/ai/discover";
import { insertDiscoveredLeads } from "@/lib/leads/store";
import { logActivity } from "@/lib/activity/store";
import { listAgents } from "@/lib/agents/store";
import { trackJobStart, trackJobFinish } from "@/lib/jobs/store";

// A small canned set so the flow still completes with no Firecrawl key —
// a real fallback, not a separate feature.
const CANNED_BRANDS: BrandCandidate[] = [
  { name: "Glow Skincare", company: "Glow Skincare", platform: "Instagram" },
  { name: "Bloom Nutrition", company: "Bloom Nutrition", platform: "TikTok" },
  { name: "Verve Athletics", company: "Verve Athletics", platform: "Instagram" },
];

// Shared by the "Discover brands" button and team chat's @mention routing.
export async function runDiscovery(): Promise<{ found: number }> {
  const [profile, agents] = await Promise.all([getMyProfile(), listAgents()]);
  const niche = profile?.niche || "";
  const scout = agents.find((a) => a.id === "discovery");

  const jobId = await trackJobStart("scrape", scout?.id ?? "discovery");
  try {
    let candidates: BrandCandidate[];
    if (isFirecrawlConfigured()) {
      const query = (niche ? niche + " " : "") + "brands that sponsor content creators partnerships";
      const hits = await searchWeb(query, 8);
      candidates = await extractBrandCandidates(niche, hits);
      if (candidates.length === 0) candidates = CANNED_BRANDS;
    } else {
      candidates = CANNED_BRANDS;
    }

    const found = await insertDiscoveredLeads(candidates);
    if (found > 0) {
      await logActivity({
        agentId: scout?.id ?? "discovery",
        type: "lead_added",
        text: (scout?.name ?? "Kaneki") + " found " + found + " new brand" + (found === 1 ? "" : "s") + " for you to review",
      });
    }
    await trackJobFinish(jobId, "done");
    return { found };
  } catch (err) {
    await trackJobFinish(jobId, "failed");
    throw err;
  }
}
