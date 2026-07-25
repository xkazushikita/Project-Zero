import Link from "next/link";
import { notFound } from "next/navigation";
import { getLead } from "@/lib/leads/store";
import { listAgents } from "@/lib/agents/store";
import { listMeetings } from "@/lib/meetings/store";
import PrepareStrategyButton from "@/components/deals/PrepareStrategyButton";
import DraftPanel from "@/components/deals/DraftPanel";
import BookMeetingBox from "@/components/calendar/BookMeetingBox";
import MeetingRow from "@/components/calendar/MeetingRow";
import { colors, fonts } from "@/lib/theme";

export default async function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, agents, allMeetings] = await Promise.all([getLead(params.id), listAgents(), listMeetings()]);
  if (!lead) notFound();
  const agent = agents.find((a) => a.id === lead.agentId) ?? null;
  const leadMeetings = allMeetings.filter((m) => m.leadId === lead.id);

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

      <div style={{ border: "1px solid " + colors.graphite, borderRadius: 12, padding: 22, background: colors.onyx, marginBottom: 28 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.copper, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 14 }}>
          Book a call
        </div>
        <BookMeetingBox leadId={lead.id} brandName={lead.name} />
        {leadMeetings.length > 0 && (
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            {leadMeetings.map((m) => (
              <MeetingRow key={m.id} meeting={m} />
            ))}
          </div>
        )}
      </div>

      {lead.research ? (
        <div style={{ border: "1px solid " + colors.graphite, borderRadius: 12, padding: 26, background: colors.onyx, marginBottom: 20 }}>
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
        <div style={{ border: "1px dashed " + colors.graphite, borderRadius: 12, padding: 24, fontSize: 13.5, color: colors.fog, marginBottom: 20 }}>
          No strategy yet, click &quot;Prepare strategy&quot; above.
        </div>
      )}

      <DraftPanel
        kind="outreach"
        title="Opening pitch"
        emptyHint="No pitch drafted yet."
        buttonLabel="Draft pitch"
        redraftLabel="Redraft pitch"
        leadId={lead.id}
        agentId={lead.agentId}
        draft={lead.outreach}
      />

      <DraftPanel
        kind="proposal"
        title="Proposal"
        emptyHint="No proposal drafted yet."
        buttonLabel="Draft proposal"
        redraftLabel="Redraft proposal"
        leadId={lead.id}
        agentId={lead.agentId}
        draft={lead.proposal}
        price={lead.proposal?.price}
      />

      <DraftPanel
        kind="follow-up"
        title="Follow up nudge"
        emptyHint="No follow up drafted yet."
        buttonLabel="Draft follow up"
        redraftLabel="Redraft follow up"
        leadId={lead.id}
        agentId={lead.agentId}
        draft={lead.followup}
      />
    </div>
  );
}
