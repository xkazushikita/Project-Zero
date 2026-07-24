"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/theme";

export default function DiscoverBrandsButton() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    setRunning(true);
    setMsg(null);
    const res = await fetch("/api/scrape", { method: "POST" });
    const data = await res.json();
    setRunning(false);
    const found = data.found ?? 0;
    setMsg(found + " brand" + (found === 1 ? "" : "s") + " added to Pending review.");
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <button
        type="button"
        onClick={run}
        disabled={running}
        style={{
          background: "transparent",
          border: "1px solid " + colors.steel,
          color: colors.bone,
          borderRadius: 999,
          padding: "9px 18px",
          fontSize: 13.5,
          cursor: running ? "default" : "pointer",
          opacity: running ? 0.6 : 1,
        }}
      >
        {running ? "Searching…" : "Discover brands"}
      </button>
      {msg && <span style={{ fontSize: 12.5, color: colors.sage }}>{msg}</span>}
    </div>
  );
}
