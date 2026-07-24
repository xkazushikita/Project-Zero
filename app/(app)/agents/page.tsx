import { listAgents, listTeams } from "@/lib/agents/store";
import { listRecentActivity } from "@/lib/activity/store";
import { enrichAgentsWithLiveStatus } from "@/lib/agents/liveStatus";
import AgentsClient from "@/components/agents/AgentsClient";

export default async function AgentsPage() {
  const [agents, teams, recentActivity] = await Promise.all([listAgents(), listTeams(), listRecentActivity(50)]);
  const enrichedAgents = enrichAgentsWithLiveStatus(agents, recentActivity);
  return <AgentsClient agents={enrichedAgents} teams={teams} />;
}
