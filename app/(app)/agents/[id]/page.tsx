import Link from "next/link";
import { notFound } from "next/navigation";
import { getAgent } from "@/lib/agents/store";
import { CAPABILITIES } from "@/lib/agentTypes";
import { colors, fonts } from "@/lib/theme";

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const agent = await getAgent(params.id);
  if (!agent) notFound();

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/agents" style={{ fontSize: 13.5, color: colors.fog }}>
        ← Back to agents
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, marginBottom: 24 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: agent.color,
            color: "#fff",
            fontSize: 20,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: "none",
          }}
        >
          {agent.initials}
        </div>
        <div>
          <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 26, color: colors.paperWhite, margin: 0 }}>{agent.name}</h1>
          <div style={{ fontSize: 14, color: colors.fog, marginTop: 2 }}>{agent.role}</div>
        </div>
      </div>

      <div style={{ border: "1px solid " + colors.graphite, borderRadius: 12, padding: 22, background: colors.onyx, display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" }}>Goal</div>
          <div style={{ fontSize: 14.5, color: colors.bone, marginTop: 6, lineHeight: 1.6 }}>{agent.goal || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" }}>Currently</div>
          <div style={{ fontSize: 14.5, color: colors.bone, marginTop: 6, lineHeight: 1.6 }}>{agent.task || "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" }}>Capabilities</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {agent.capabilities.map((c) => {
              const cap = CAPABILITIES.find((x) => x.id === c);
              return (
                <span key={c} style={{ fontSize: 12, color: colors.bone, border: "1px solid " + colors.graphite, borderRadius: 999, padding: "5px 12px" }}>
                  {cap?.label ?? c}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
