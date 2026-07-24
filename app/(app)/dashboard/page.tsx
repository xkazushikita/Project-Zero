import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import OrbitDashboard from "@/components/OrbitDashboard";
import StatTiles from "@/components/dashboard/StatTiles";
import { listAgents, listTeams } from "@/lib/agents/store";
import { listLeads, listPendingLeads } from "@/lib/leads/store";
import { listRecentActivity } from "@/lib/activity/store";
import { colors, fonts } from "@/lib/theme";

export default async function DashboardPage() {
  const [clerkUser, agents, teams, leads, pending, recentActivity] = await Promise.all([
    clerkCurrentUser(),
    listAgents(),
    listTeams(),
    listLeads(),
    listPendingLeads(),
    listRecentActivity(6),
  ]);
  const firstName = clerkUser?.firstName || "there";

  const tiles = [
    { value: leads.length, label: "Brands in pipeline" },
    { value: pending.length, label: "Pending review" },
    { value: leads.filter((l) => l.research).length, label: "Strategies ready" },
    { value: leads.filter((l) => l.status === "booked").length, label: "Calls booked" },
  ];

  const now = new Date();
  const leadsThisMonth = leads.filter((l) => {
    const d = new Date(l.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const workingAgentIds = new Set(leads.filter((l) => l.status !== "booked" && l.agentId).map((l) => l.agentId as string));

  const stats = {
    activeAgents: workingAgentIds.size,
    tasksRunning: leads.filter((l) => l.status !== "booked").length,
    leadsWorked: leadsThisMonth,
    perAgent: agents.map((a) => ({ agentId: a.id, leadsWorked: leads.filter((l) => l.agentId === a.id).length })),
  };

  const activityItems = recentActivity
    .filter((a): a is { agentId: string; text: string } => Boolean(a.agentId))
    .map((a) => ({ agentId: a.agentId, text: a.text }));

  return (
    <div>
      <h1
        style={{
          fontFamily: fonts.serif,
          fontWeight: 400,
          fontSize: 26,
          letterSpacing: "0.01em",
          color: colors.paperWhite,
          margin: "0 0 20px",
        }}
      >
        Welcome back, {firstName}.
      </h1>
      <StatTiles tiles={tiles} />
      <OrbitDashboard agents={agents} teams={teams} stats={stats} activity={activityItems} chromeAbove={290} />
    </div>
  );
}
