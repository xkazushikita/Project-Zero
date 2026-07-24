import { listAgents, listTeams } from "@/lib/agents/store";
import AgentsClient from "@/components/agents/AgentsClient";

export default async function AgentsPage() {
  const [agents, teams] = await Promise.all([listAgents(), listTeams()]);
  return <AgentsClient agents={agents} teams={teams} />;
}
