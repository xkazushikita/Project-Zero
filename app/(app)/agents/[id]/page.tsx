import { notFound } from "next/navigation";
import { listAgents } from "@/lib/agents/store";
import { enrichAgentsWithLiveStatus } from "@/lib/agents/liveStatus";
import { listLeads } from "@/lib/leads/store";
import { listMeetings } from "@/lib/meetings/store";
import { listRecentActivity, listActivityForAgent } from "@/lib/activity/store";
import AgentProfile from "@/components/agents/AgentProfile";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const [agents, leads, meetings, recentActivity] = await Promise.all([
    listAgents(),
    listLeads(),
    listMeetings(),
    listRecentActivity(50),
  ]);

  const enriched = enrichAgentsWithLiveStatus(agents, recentActivity);
  const agent = enriched.find((a) => a.id === params.id);
  if (!agent) notFound();

  const activityLog = await listActivityForAgent(agent.id, 20);
  const brandsWorked = leads.filter((l) => l.agentId === agent.id).length;
  const callsBooked = meetings.filter((m) => m.agentId === agent.id).length;

  return (
    <AgentProfile
      agent={agent}
      stats={{ brandsWorked, callsBooked, tasksLogged: activityLog.length }}
      activityLog={activityLog}
    />
  );
}
