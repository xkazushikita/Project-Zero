"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/theme";
import { enqueueOutreachJob, enqueueProposalJob, enqueueFollowupJob } from "@/lib/jobs/store";

const ENQUEUE = {
  outreach: enqueueOutreachJob,
  proposal: enqueueProposalJob,
  "follow-up": enqueueFollowupJob,
} as const;

export default function DraftButton({
  kind,
  leadId,
  agentId,
  hasDraft,
  label,
  redraftLabel,
}: {
  kind: "outreach" | "proposal" | "follow-up";
  leadId: string;
  agentId: string | null;
  hasDraft: boolean;
  label: string;
  redraftLabel: string;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    await ENQUEUE[kind](leadId, agentId);
    let done = false;
    while (!done) {
      const res = await fetch("/api/jobs/run", { method: "POST" });
      const data = await res.json();
      done = Boolean(data.done);
      if (!done) await new Promise((r) => setTimeout(r, 800));
    }
    setRunning(false);
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={running}
      onClick={run}
      style={{
        background: "transparent",
        color: colors.bone,
        border: "1px solid " + colors.steel,
        borderRadius: 999,
        padding: "8px 18px",
        fontSize: 13,
        fontWeight: 500,
        cursor: running ? "default" : "pointer",
        opacity: running ? 0.6 : 1,
      }}
    >
      {running ? "Drafting…" : hasDraft ? redraftLabel : label}
    </button>
  );
}
