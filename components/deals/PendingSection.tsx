"use client";
import { useTransition } from "react";
import { colors, fonts } from "@/lib/theme";
import { acceptLead, rejectLead } from "@/lib/leads/store";
import type { Lead } from "@/lib/leads/types";

export default function PendingSection({ pending }: { pending: Lead[] }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div style={{ marginBottom: 44 }}>
      <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 20, letterSpacing: "0.01em", color: colors.paperWhite, margin: "0 0 6px" }}>
        Pending review
      </h2>
      <p style={{ color: colors.mist, fontSize: 13.5, marginBottom: 16 }}>
        Brands your agents find get parked here — accept the ones worth pitching, reject the rest.
      </p>

      {pending.length === 0 ? (
        <div style={{ border: "1px dashed " + colors.graphite, borderRadius: 10, padding: 20, fontSize: 13.5, color: colors.fog }}>
          Nothing waiting right now. Once your Research agent discovers brands, they&apos;ll show up here for you to approve.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
          {pending.map((lead) => (
            <div key={lead.id} style={{ border: "1px solid " + colors.graphite, borderRadius: 10, padding: 14, background: colors.onyx }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: colors.paperWhite }}>{lead.name}</div>
              {lead.company && <div style={{ fontSize: 12.5, color: colors.mist, marginTop: 2 }}>{lead.company}</div>}
              {lead.platform && <div style={{ fontSize: 11.5, color: colors.fog, marginTop: 4 }}>{lead.platform}</div>}
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      acceptLead(lead.id);
                    })
                  }
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    padding: "7px 0",
                    borderRadius: 999,
                    background: colors.paperWhite,
                    color: "#000",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Accept
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(() => {
                      rejectLead(lead.id);
                    })
                  }
                  style={{
                    flex: 1,
                    fontSize: 12.5,
                    padding: "7px 0",
                    borderRadius: 999,
                    background: "transparent",
                    color: colors.errorRed,
                    border: "1px solid " + colors.graphite,
                    cursor: "pointer",
                  }}
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
