"use client";
import { useTransition } from "react";
import Link from "next/link";
import { colors } from "@/lib/theme";
import { updateLeadStatus, assignLead, removeLead } from "@/lib/leads/store";
import { STAGES } from "@/lib/leads/types";
import type { Lead, LeadStatus } from "@/lib/leads/types";
import type { AppAgent } from "@/lib/agents/types";
import PrepareStrategyButton from "./PrepareStrategyButton";

const selectStyle = {
  marginTop: 8,
  width: "100%",
  fontSize: 12,
  padding: "6px 8px",
  borderRadius: 6,
  background: "transparent",
  border: "1px solid " + colors.graphite,
  color: colors.bone,
} as const;

export default function PipelineBoard({ leads, agents }: { leads: Lead[]; agents: AppAgent[] }) {
  const [, startTransition] = useTransition();

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(210px, 1fr))", gap: 14, overflowX: "auto", paddingBottom: 8 }}>
      {STAGES.map((stage) => {
        const items = leads.filter((l) => l.status === stage.id);
        return (
          <div key={stage.id} style={{ minWidth: 210 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" }}>{stage.label}</div>
              <div style={{ fontSize: 12, color: colors.fog }}>{items.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {items.map((lead) => (
                <div key={lead.id} style={{ border: "1px solid " + colors.graphite, borderRadius: 10, padding: 14, background: colors.onyx }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                    <Link
                      href={"/deals/" + lead.id}
                      style={{ fontSize: 14, fontWeight: 600, color: colors.paperWhite, textDecoration: "underline", textDecorationColor: colors.graphite, textUnderlineOffset: 3 }}
                    >
                      {lead.name}
                    </Link>
                    <button
                      type="button"
                      aria-label={"Remove " + lead.name}
                      title="Remove from pipeline"
                      onClick={() => {
                        if (confirm("Remove " + lead.name + " from your pipeline?")) {
                          startTransition(() => {
                            removeLead(lead.id);
                          });
                        }
                      }}
                      style={{ background: "transparent", border: "none", color: colors.fog, fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 2, flex: "none" }}
                    >
                      ×
                    </button>
                  </div>
                  {lead.company && <div style={{ fontSize: 12.5, color: colors.mist, marginTop: 2 }}>{lead.company}</div>}
                  {lead.platform && <div style={{ fontSize: 11.5, color: colors.fog, marginTop: 4 }}>{lead.platform}</div>}
                  {lead.profileUrl && (
                    <a
                      href={lead.profileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: 6, fontSize: 11.5, color: colors.copper }}
                    >
                      {lead.platform ? "View profile ↗" : "Visit site ↗"}
                    </a>
                  )}

                  {lead.research ? (
                    <Link
                      href={"/deals/" + lead.id}
                      style={{ display: "block", marginTop: 10, fontSize: 12, color: colors.sage }}
                    >
                      ✓ Strategy ready — view
                    </Link>
                  ) : (
                    <div style={{ marginTop: 10 }}>
                      <PrepareStrategyButton leadId={lead.id} agentId={lead.agentId} hasStrategy={false} compact />
                    </div>
                  )}

                  <select
                    aria-label="Stage"
                    value={lead.status}
                    onChange={(e) => {
                      const v = e.target.value as LeadStatus;
                      startTransition(() => {
                        updateLeadStatus(lead.id, v);
                      });
                    }}
                    style={selectStyle}
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id} style={{ background: colors.onyx }}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="Assigned agent"
                    value={lead.agentId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value || null;
                      startTransition(() => {
                        assignLead(lead.id, v);
                      });
                    }}
                    style={selectStyle}
                  >
                    <option value="" style={{ background: colors.onyx }}>
                      Unassigned
                    </option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id} style={{ background: colors.onyx }}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {items.length === 0 && <div style={{ fontSize: 12, color: colors.fog, fontStyle: "italic" }}>Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
