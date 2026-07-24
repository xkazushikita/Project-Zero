"use client";
import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import PendingSection from "./PendingSection";
import PipelineBoard from "./PipelineBoard";
import AddLeadModal from "./AddLeadModal";
import ImportCsvModal from "./ImportCsvModal";
import DiscoverBrandsButton from "./DiscoverBrandsButton";
import type { Lead } from "@/lib/leads/types";
import type { AppAgent } from "@/lib/agents/types";

export default function DealsClient({ leads, pending, agents }: { leads: Lead[]; pending: Lead[]; agents: AppAgent[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const pillButton = {
    background: "transparent",
    border: "1px solid " + colors.steel,
    color: colors.bone,
    borderRadius: 999,
    padding: "9px 18px",
    fontSize: 13.5,
    cursor: "pointer",
  } as const;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
          Brand Deals
        </h1>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={() => setShowImport(true)} style={pillButton}>
            Import CSV
          </button>
          <button type="button" onClick={() => setShowAdd(true)} style={{ ...pillButton, background: colors.paperWhite, color: "#000", border: "none", fontWeight: 500 }}>
            + Add brand
          </button>
        </div>
      </div>
      <p style={{ color: colors.mist, fontSize: 14.5, marginTop: 8, marginBottom: 24 }}>
        Every brand you&apos;re working, from first contact to booked call.
      </p>

      <div style={{ marginBottom: 32 }}>
        <DiscoverBrandsButton />
      </div>

      <PendingSection pending={pending} />

      <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 20, letterSpacing: "0.01em", color: colors.paperWhite, margin: "0 0 16px" }}>
        Pipeline
      </h2>
      <PipelineBoard leads={leads} agents={agents} />

      {showAdd && <AddLeadModal agents={agents} onClose={() => setShowAdd(false)} />}
      {showImport && <ImportCsvModal onClose={() => setShowImport(false)} />}
    </div>
  );
}
