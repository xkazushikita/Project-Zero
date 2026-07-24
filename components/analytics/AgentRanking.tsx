import { colors } from "@/lib/theme";
import type { AppAgent } from "@/lib/agents/types";

export default function AgentRanking({ ranking }: { ranking: { agent: AppAgent; count: number }[] }) {
  const max = Math.max(1, ...ranking.map((r) => r.count));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {ranking.map(({ agent, count }) => (
        <div key={agent.id}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
            <span style={{ color: colors.bone }}>{agent.name}</span>
            <span style={{ color: colors.fog }}>{count}</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "rgba(255,255,255,.08)", overflow: "hidden" }}>
            <div style={{ width: (count / max) * 100 + "%", height: "100%", background: agent.color, borderRadius: 3 }} />
          </div>
        </div>
      ))}
    </div>
  );
}
