import Link from "next/link";
import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import OrbitDashboard from "@/components/OrbitDashboard";
import StatTiles from "@/components/dashboard/StatTiles";
import { listAgents, listTeams } from "@/lib/agents/store";
import { listLeads, listPendingLeads } from "@/lib/leads/store";
import { listMeetings } from "@/lib/meetings/store";
import { listRecentActivity } from "@/lib/activity/store";
import { enrichAgentsWithLiveStatus } from "@/lib/agents/liveStatus";
import { getTikTokConnection } from "@/lib/tiktok/store";
import { getFacebookConnection } from "@/lib/facebook/store";
import { colors, fonts } from "@/lib/theme";

export default async function DashboardPage() {
  const [clerkUser, rawAgents, teams, leads, pending, recentActivity, meetings, tiktok, facebook] = await Promise.all([
    clerkCurrentUser(),
    listAgents(),
    listTeams(),
    listLeads(),
    listPendingLeads(),
    listRecentActivity(50),
    listMeetings(),
    getTikTokConnection(),
    getFacebookConnection(),
  ]);
  const firstName = clerkUser?.firstName || "there";
  const agents = enrichAgentsWithLiveStatus(rawAgents, recentActivity);

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

  const workingAgentIds = new Set(agents.filter((a) => a.status === "working").map((a) => a.id));

  const stats = {
    activeAgents: workingAgentIds.size,
    tasksRunning: leads.filter((l) => l.status !== "booked").length,
    leadsWorked: leadsThisMonth,
    perAgent: agents.map((a) => ({ agentId: a.id, leadsWorked: leads.filter((l) => l.agentId === a.id).length })),
  };

  const activityItems = recentActivity
    .filter((a): a is { agentId: string; text: string } => Boolean(a.agentId))
    .map((a) => ({ agentId: a.agentId, text: a.text }));

  const researched = leads.filter((l) => l.research).slice(0, 4);
  const pitched = leads.filter((l) => l.outreach).slice(0, 4);
  const proposed = leads.filter((l) => l.proposal).slice(0, 4);
  const followedUp = leads.filter((l) => l.followup).slice(0, 4);
  const upcomingMeetings = meetings.filter((m) => new Date(m.whenAt) >= now).slice(0, 4);

  const panelStyle = { border: "1px solid " + colors.graphite, borderRadius: 12, padding: 20, background: colors.onyx } as const;
  const panelTitle = { fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" as const, marginBottom: 12 };
  const emptyStyle = { fontSize: 13, color: colors.fog, fontStyle: "italic" as const };

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
      <OrbitDashboard
        agents={agents}
        teams={teams}
        stats={stats}
        activity={activityItems}
        chromeAbove={290}
        live
        creatorAvatarUrl={tiktok?.avatarUrl ?? facebook?.avatarUrl ?? null}
        creatorFollowers={tiktok?.followerCount ?? facebook?.followerCount ?? null}
      />

      <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 20, color: colors.paperWhite, margin: "36px 0 16px" }}>
        Your business, at a glance
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        <div style={panelStyle}>
          <div style={panelTitle}>Recent brand research</div>
          {researched.length === 0 ? (
            <div style={emptyStyle}>No strategies prepared yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {researched.map((l) => (
                <Link key={l.id} href={"/deals/" + l.id} style={{ fontSize: 13.5, color: colors.bone }}>
                  {l.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelTitle}>Upcoming calls</div>
          {upcomingMeetings.length === 0 ? (
            <div style={emptyStyle}>Nothing booked yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcomingMeetings.map((m) => (
                <div key={m.id} style={{ fontSize: 13.5, color: colors.bone }}>
                  {m.title} <span style={{ color: colors.copper }}>· {m.whenLabel}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelTitle}>Outreach campaigns</div>
          {pitched.length === 0 ? (
            <div style={emptyStyle}>No pitches drafted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {pitched.map((l) => (
                <Link key={l.id} href={"/deals/" + l.id} style={{ fontSize: 13.5, color: colors.bone }}>
                  {l.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelTitle}>Proposals</div>
          {proposed.length === 0 ? (
            <div style={emptyStyle}>No proposals drafted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {proposed.map((l) => (
                <Link key={l.id} href={"/deals/" + l.id} style={{ fontSize: 13.5, color: colors.bone }}>
                  {l.name} {l.proposal?.price != null && <span style={{ color: colors.copper }}>· ${l.proposal.price.toLocaleString()}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelTitle}>Follow-ups</div>
          {followedUp.length === 0 ? (
            <div style={emptyStyle}>No follow ups drafted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {followedUp.map((l) => (
                <Link key={l.id} href={"/deals/" + l.id} style={{ fontSize: 13.5, color: colors.bone }}>
                  {l.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div style={panelStyle}>
          <div style={panelTitle}>Collaboration history</div>
          {leads.filter((l) => l.status === "booked").length === 0 ? (
            <div style={emptyStyle}>No completed collaborations yet.</div>
          ) : (
            <div style={{ fontSize: 13.5, color: colors.bone }}>
              {leads.filter((l) => l.status === "booked").length} brand{leads.filter((l) => l.status === "booked").length === 1 ? "" : "s"} booked so far
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
