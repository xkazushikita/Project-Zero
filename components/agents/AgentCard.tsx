"use client";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { colors, fonts } from "@/lib/theme";
import { av } from "@/lib/visuals";
import { statusMeta } from "@/lib/status";
import { pauseAgent, removeAgent } from "@/lib/agents/store";
import type { AppAgent } from "@/lib/agents/types";
import { CAPABILITIES } from "@/lib/agentTypes";

export default function AgentCard({ agent }: { agent: AppAgent }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const meta = statusMeta(agent.paused ? "offline" : agent.status);

  return (
    <div
      style={{
        border: "1px solid " + colors.graphite,
        borderRadius: 12,
        padding: 20,
        background: colors.onyx,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }} onClick={() => router.push("/agents/" + agent.id)}>
        <div style={{ ...cssToObj(av(agent, 42)), border: "2px solid " + colors.obsidian }}>{agent.initials}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: colors.paperWhite, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 12.5, color: colors.fog }}>{agent.role}</div>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.dot, flex: "none" }} />
        <span style={{ fontSize: 12, color: meta.color }}>{agent.paused ? "Paused" : meta.label}</span>
      </div>

      <div style={{ fontSize: 13, color: colors.mist, lineHeight: 1.5, minHeight: 36 }}>{agent.task}</div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {agent.capabilities.map((c) => {
          const cap = CAPABILITIES.find((x) => x.id === c);
          return (
            <span
              key={c}
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: colors.fog,
                border: "1px solid " + colors.graphite,
                borderRadius: 999,
                padding: "3px 9px",
              }}
            >
              {cap?.label ?? c}
            </span>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            startTransition(() => {
              pauseAgent(agent.id, !agent.paused);
            })
          }
          style={{
            flex: 1,
            fontSize: 12.5,
            padding: "7px 0",
            borderRadius: 999,
            background: "transparent",
            border: "1px solid " + colors.steel,
            color: colors.bone,
            cursor: "pointer",
          }}
        >
          {agent.paused ? "Resume" : "Pause"}
        </button>
        {!agent.isPreset && (
          <button
            type="button"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                removeAgent(agent.id);
              })
            }
            style={{
              flex: 1,
              fontSize: 12.5,
              padding: "7px 0",
              borderRadius: 999,
              background: "transparent",
              border: "1px solid " + colors.graphite,
              color: colors.errorRed,
              cursor: "pointer",
            }}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}

// `av()` returns a CSS-string for the shared dashboard primitives; parse it into a plain style object here.
function cssToObj(cssString: string): React.CSSProperties {
  const o: Record<string, string> = {};
  for (const decl of cssString.split(";")) {
    const i = decl.indexOf(":");
    if (i < 0) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase());
    o[prop] = decl.slice(i + 1).trim();
  }
  return o as React.CSSProperties;
}
