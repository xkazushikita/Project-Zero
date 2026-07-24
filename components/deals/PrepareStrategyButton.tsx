"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/theme";
import { enqueueResearchJob } from "@/lib/jobs/store";

export default function PrepareStrategyButton({
  leadId,
  agentId,
  hasStrategy,
  compact,
}: {
  leadId: string;
  agentId: string | null;
  hasStrategy: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);

  async function run() {
    setRunning(true);
    await enqueueResearchJob(leadId, agentId);
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
        width: compact ? "100%" : undefined,
        background: compact ? "transparent" : colors.paperWhite,
        color: compact ? colors.bone : "#000",
        border: compact ? "1px solid " + colors.steel : "none",
        borderRadius: 999,
        padding: compact ? "7px 0" : "9px 20px",
        fontSize: compact ? 12 : 13.5,
        fontWeight: 500,
        cursor: running ? "default" : "pointer",
        opacity: running ? 0.6 : 1,
      }}
    >
      {running ? "Preparing…" : hasStrategy ? "Refresh strategy" : "Prepare strategy"}
    </button>
  );
}
