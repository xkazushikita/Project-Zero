import { colors } from "@/lib/theme";
import type { AppTeam, AppAgent } from "@/lib/agents/types";

export default function TeamCard({ team, agents }: { team: AppTeam; agents: AppAgent[] }) {
  const members = team.members.map((id) => agents.find((a) => a.id === id)).filter(Boolean) as AppAgent[];

  return (
    <div style={{ border: "1px solid " + colors.graphite, borderRadius: 12, padding: 20, background: colors.onyx }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: team.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            flex: "none",
          }}
        >
          {team.icon}
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: colors.paperWhite }}>{team.name}</div>
      </div>
      <div style={{ fontSize: 13, color: colors.mist, lineHeight: 1.5, marginBottom: 16 }}>{team.description}</div>
      <div style={{ display: "flex", alignItems: "center", gap: -6 }}>
        {members.map((m, i) => (
          <div
            key={m.id}
            style={{
              marginLeft: i === 0 ? 0 : -8,
              width: 30,
              height: 30,
              borderRadius: "50%",
              background: m.color,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid " + colors.onyx,
            }}
            title={m.name}
          >
            {m.initials}
          </div>
        ))}
        {members.length === 0 && <div style={{ fontSize: 12.5, color: colors.fog }}>No teammates yet</div>}
      </div>
    </div>
  );
}
