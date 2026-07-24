"use client";
import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { colors, fonts } from "@/lib/theme";
import { createAgent } from "@/lib/agents/store";
import { CAPABILITIES, type CapabilityId } from "@/lib/agentTypes";

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  background: "transparent",
  border: "1px solid " + colors.graphite,
  color: colors.bone,
  fontSize: 14.5,
  fontFamily: "inherit",
  outline: "none",
};
const labelStyle: CSSProperties = { fontSize: 13, fontWeight: 600, color: colors.bone, marginBottom: 8, display: "block" };

export default function NewAgentModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [goal, setGoal] = useState("");
  const [capabilities, setCapabilities] = useState<CapabilityId[]>([]);

  function toggleCapability(id: CapabilityId) {
    setCapabilities((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));
  }

  function submit() {
    if (!name.trim() || capabilities.length === 0) return;
    startTransition(async () => {
      await createAgent({ name: name.trim(), role: role.trim() || "Custom", goal: goal.trim(), capabilities });
      onClose();
    });
  }

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 20 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(480px, 100%)", background: colors.onyx, border: "1px solid " + colors.graphite, borderRadius: 16, padding: 30 }}
      >
        <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 22, color: colors.paperWhite, margin: "0 0 20px" }}>New agent</h2>

        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Deal Closer" />

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Role (optional)</label>
          <input style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Negotiation" />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Goal (optional)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="What should this agent focus on?"
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>What can it do?</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {CAPABILITIES.map((c) => {
              const active = capabilities.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCapability(c.id)}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    padding: "7px 14px",
                    borderRadius: 999,
                    cursor: "pointer",
                    background: active ? colors.paperWhite : "transparent",
                    color: active ? "#000" : colors.bone,
                    border: "1px solid " + (active ? colors.paperWhite : colors.steel),
                  }}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 26 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid " + colors.steel, color: colors.bone, borderRadius: 999, padding: "9px 18px", fontSize: 13.5, cursor: "pointer" }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={isPending || !name.trim() || capabilities.length === 0}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "9px 20px",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              opacity: !name.trim() || capabilities.length === 0 ? 0.5 : 1,
            }}
          >
            {isPending ? "Creating…" : "Create agent"}
          </button>
        </div>
      </div>
    </div>
  );
}
