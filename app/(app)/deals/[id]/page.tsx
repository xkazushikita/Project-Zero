import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/lib/leads/store";
import { listAgents } from "@/lib/agents/store";
import PrepareStrategyButton from "@/components/deals/PrepareStrategyButton";
import { colors, fonts } from "@/lib/theme";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, agents] = await Promise.all([getLead(params.id), listAgents()]);
  if (!lead) notFound();
  const agent = agents.find((a) => a.id === lead.agentId) ?? null;

  return (
    <div style={{ maxWidth: 680 }}>
      <Link href="/deals" style={{ fontSize: 13.5, color: colors.fog }}>
        ← Back to deals
      </Link>

      <div style={{ marginTop: 20, marginBottom: 8 }}>
        <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 26, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
          {lead.name}
        </h1>
        <div style={{ fontSize: 14, color: colors.mist, marginTop: 6 }}>
          {[lead.company, lead.platform].filter(Boolean).join(" · ") || "No extra details yet"}
          {agent && <> · Assigned to {agent.name}</>}
        </div>
        {lead.profileUrl && (
          <a href={lead.profileUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 8, fontSize: 13, color: colors.copper }}>
            {lead.platform ? "View profile ↗" : "Visit site ↗"}
          </a>
        )}
      </div>

      <div style={{ margin: "24px 0 28px" }}>
        <PrepareStrategyButton leadId={lead.id} agentId={lead.agentId} hasStrategy={Boolean(lead.research)} />
      </div>

      {lead.research ? (
        <div style={{ border: "1px solid " + colors.graphite, borderRadius: 12, padding: 26, background: colors.onyx }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.copper, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 18 }}>
            Pitch strategy
          </div>

          <div style={{ marginBottom: 22 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>Overview</div>
            <div style={{ fontSize: 14.5, color: colors.bone, lineHeight: 1.7 }}>{lead.research.summary}</div>
          </div>

          {lead.research.priorities.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>
                What they care about
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: colors.bone, fontSize: 14, lineHeight: 1.9 }}>
                {lead.research.priorities.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {lead.research.hooks.length > 0 && (
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>Talking points</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: colors.bone, fontSize: 14, lineHeight: 1.9 }}>
                {lead.research.hooks.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>
              Collaboration angle
            </div>
            <div style={{ fontSize: 14.5, color: colors.bone, lineHeight: 1.7 }}>{lead.research.angle}</div>
          </div>
        </div>
      ) : (
        <div style={{ border: "1px dashed " + colors.graphite, borderRadius: 12, padding: 24, fontSize: 13.5, color: colors.fog }}>
          No strategy yet — click &quot;Prepare strategy&quot; above.
        </div>
      )}
    </div>
  );
}
