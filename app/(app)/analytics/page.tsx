import { listLeads, listPendingLeads } from "@/lib/leads/store";
import { listMeetings } from "@/lib/meetings/store";
import { listAgents } from "@/lib/agents/store";
import { listActivityForAnalytics } from "@/lib/activity/store";
import { STAGES } from "@/lib/leads/types";
import StatTiles from "@/components/dashboard/StatTiles";
import DailyActivityChart from "@/components/analytics/DailyActivityChart";
import AgentRanking from "@/components/analytics/AgentRanking";
import { colors, fonts } from "@/lib/theme";

export default async function AnalyticsPage() {
  const [leads, pending, meetings, agents, activityLog] = await Promise.all([
    listLeads(),
    listPendingLeads(),
    listMeetings(),
    listAgents(),
    listActivityForAnalytics(14),
  ]);

  const tiles = [
    { value: leads.length, label: "Brands worked" },
    { value: leads.filter((l) => l.research).length, label: "Strategies prepared" },
    { value: meetings.length, label: "Calls booked" },
    { value: pending.length, label: "Pending review" },
  ];

  const days: { label: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const count = activityLog.filter((a) => a.createdAt.slice(0, 10) === key).length;
    days.push({ label, count });
  }

  const countByAgent = new Map<string, number>();
  for (const a of activityLog) {
    if (!a.agentId) continue;
    countByAgent.set(a.agentId, (countByAgent.get(a.agentId) ?? 0) + 1);
  }
  const ranking = agents
    .map((agent) => ({ agent, count: countByAgent.get(agent.id) ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);

  const stageCounts = STAGES.map((s) => ({ ...s, count: leads.filter((l) => l.status === s.id).length }));
  const maxStage = Math.max(1, ...stageCounts.map((s) => s.count));

  const panelStyle = { border: "1px solid " + colors.graphite, borderRadius: 12, padding: 22, background: colors.onyx } as const;
  const panelTitle = { fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" as const, marginBottom: 16 };
  const emptyStyle = { fontSize: 13, color: colors.fog, fontStyle: "italic" as const };

  return (
    <div>
      <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
        Analytics
      </h1>
      <p style={{ color: colors.mist, fontSize: 14.5, marginTop: 8, marginBottom: 24 }}>
        Real numbers from your actual pipeline and activity log — nothing simulated.
      </p>

      <StatTiles tiles={tiles} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginTop: 12 }}>
        <div style={panelStyle}>
          <div style={panelTitle}>Activity, last 14 days</div>
          <DailyActivityChart days={days} />
        </div>

        <div style={panelStyle}>
          <div style={panelTitle}>Output by agent</div>
          {ranking.length === 0 ? <div style={emptyStyle}>No activity yet — run a task and it&apos;ll show up here.</div> : <AgentRanking ranking={ranking} />}
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 16 }}>
        <div style={panelTitle}>Pipeline breakdown</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {stageCounts.map((s) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 90, fontSize: 12.5, color: colors.fog }}>{s.label}</div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
                <div style={{ width: (s.count / maxStage) * 100 + "%", height: "100%", background: colors.copper, borderRadius: 4 }} />
              </div>
              <div style={{ width: 24, textAlign: "right", fontSize: 12.5, color: colors.bone }}>{s.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
