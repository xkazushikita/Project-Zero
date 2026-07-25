import type { AppAgent } from "./types";

// Capabilities that actually have a real engine behind them right now.
// Everything else gets an honest "not built yet" instead of a fake "Working".
const IMPLEMENTED = ["scrape", "research", "book-meeting", "outreach", "proposal", "follow-up"];

export function enrichAgentsWithLiveStatus(agents: AppAgent[], recentActivity: { agentId: string | null; text: string }[]): AppAgent[] {
  return agents.map((a) => {
    const hasRealCapability = a.capabilities.some((c) => IMPLEMENTED.includes(c));
    if (!hasRealCapability) {
      return { ...a, status: "waiting", task: "This capability isn't built yet — coming soon" };
    }
    const latest = recentActivity.find((act) => act.agentId === a.id);
    if (latest) {
      return { ...a, status: "working", task: latest.text };
    }
    return { ...a, status: "waiting", task: "Ready to get to work" };
  });
}
