"use client";
import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { colors, fonts } from "@/lib/theme";
import { createTeam } from "@/lib/agents/store";
import type { AppAgent } from "@/lib/agents/types";

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

export default function NewTeamModal({ agents, onClose }: { agents: AppAgent[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [members, setMembers] = useState<string[]>([]);

  function toggleMember(id: string) {
    setMembers((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  function submit() {
    if (!name.trim() || members.length === 0) return;
    startTransition(async () => {
      await createTeam({ name: name.trim(), description: description.trim(), goal: goal.trim(), members });
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
        <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 22, color: colors.paperWhite, margin: "0 0 20px" }}>New team</h2>

        <label style={labelStyle}>Name</label>
        <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Launch Squad" />

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Description (optional)</label>
          <input style={inputStyle} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this team for?" />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Goal (optional)</label>
          <input style={inputStyle} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What should this team accomplish?" />
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>Who&apos;s on it?</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {agents.map((a) => {
              const active = members.includes(a.id);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleMember(a.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontSize: 13.5,
                    padding: "9px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: active ? colors.carbon : "transparent",
                    color: colors.bone,
                    border: "1px solid " + (active ? colors.copper : colors.graphite),
                    textAlign: "left",
                  }}
                >
                  <span style={{ width: 22, height: 22, borderRadius: "50%", background: a.color, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                    {a.initials}
                  </span>
                  {a.name}
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
            disabled={isPending || !name.trim() || members.length === 0}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "9px 20px",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              opacity: !name.trim() || members.length === 0 ? 0.5 : 1,
            }}
          >
            {isPending ? "Creating…" : "Create team"}
          </button>
        </div>
      </div>
    </div>
  );
}
