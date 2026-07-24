"use client";
import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { colors, fonts } from "@/lib/theme";
import { statusMeta } from "@/lib/status";
import { updateAgentProfile, setAgentAvatar } from "@/lib/agents/store";
import { CAPABILITIES } from "@/lib/agentTypes";
import type { AppAgent } from "@/lib/agents/types";
import type { AgentActivityEntry } from "@/lib/activity/store";
import AgentAvatar from "./AgentAvatar";

const AVATAR_SIZE = 160;

// Downscales whatever photo the creator picks to a small square JPEG data URL,
// so it can live directly in the database without needing file storage.
function resizeToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't read that image"));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = AVATAR_SIZE;
        canvas.height = AVATAR_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        const side = Math.min(img.width, img.height);
        const sx = (img.width - side) / 2;
        const sy = (img.height - side) / 2;
        ctx.drawImage(img, sx, sy, side, side, 0, 0, AVATAR_SIZE, AVATAR_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.round(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return mins + "m ago";
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  return Math.round(hrs / 24) + "d ago";
}

export default function AgentProfile({
  agent,
  stats,
  activityLog,
}: {
  agent: AppAgent;
  stats: { brandsWorked: number; callsBooked: number; tasksLogged: number };
  activityLog: AgentActivityEntry[];
}) {
  const [editing, setEditing] = useState(false);
  const [role, setRole] = useState(agent.role);
  const [goal, setGoal] = useState(agent.goal);
  const [avatarUrl, setAvatarUrl] = useState(agent.avatarUrl);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const meta = statusMeta(agent.paused ? "offline" : agent.status);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAvatarError("That's not an image file — try a JPG or PNG.");
      return;
    }
    setAvatarError(null);
    setAvatarBusy(true);
    try {
      const dataUrl = await resizeToDataUrl(file);
      setAvatarUrl(dataUrl);
      await setAgentAvatar(agent.id, dataUrl);
    } catch {
      setAvatarError("Couldn't use that photo — try a different one.");
    } finally {
      setAvatarBusy(false);
    }
  }

  function removePhoto() {
    setAvatarUrl(null);
    startTransition(() => {
      setAgentAvatar(agent.id, null);
    });
  }

  const panelStyle = { border: "1px solid " + colors.graphite, borderRadius: 12, padding: 22, background: colors.onyx } as const;
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" as const };
  const inputStyle = {
    width: "100%",
    marginTop: 8,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid " + colors.steel,
    background: colors.obsidian,
    color: colors.paperWhite,
    fontSize: 14,
    fontFamily: "inherit",
  } as const;

  function save() {
    startTransition(() => {
      updateAgentProfile(agent.id, { role, goal });
      setEditing(false);
    });
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <Link href="/agents" style={{ fontSize: 13.5, color: colors.fog }}>
        ← Back to agents
      </Link>

      <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, marginBottom: 8 }}>
        <div style={{ position: "relative" }}>
          <AgentAvatar avatarUrl={avatarUrl} color={agent.color} initials={agent.initials} size={56} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarBusy}
            title="Change photo"
            style={{
              position: "absolute",
              bottom: -2,
              right: -2,
              width: 24,
              height: 24,
              borderRadius: "50%",
              background: colors.copper,
              border: "2px solid " + colors.obsidian,
              color: colors.obsidian,
              fontSize: 12,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {avatarBusy ? "…" : "✎"}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: "none" }} />
        </div>
        <div>
          <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 26, color: colors.paperWhite, margin: 0 }}>{agent.name}</h1>
          {!editing ? (
            <div style={{ fontSize: 14, color: colors.fog, marginTop: 2 }}>{agent.role}</div>
          ) : null}
          {avatarUrl && (
            <button
              type="button"
              onClick={removePhoto}
              style={{ background: "transparent", border: "none", color: colors.fog, fontSize: 12, padding: 0, marginTop: 4, cursor: "pointer", textDecoration: "underline" }}
            >
              Remove photo
            </button>
          )}
        </div>
      </div>
      {avatarError && <div style={{ fontSize: 12.5, color: colors.errorRed, marginBottom: 12 }}>{avatarError}</div>}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: meta.dot, flex: "none" }} />
        <span style={{ fontSize: 12.5, color: meta.color }}>{agent.paused ? "Paused" : meta.label}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        {[
          { value: stats.brandsWorked, label: "Brands worked" },
          { value: stats.callsBooked, label: "Calls booked" },
          { value: stats.tasksLogged, label: "Tasks logged" },
        ].map((s) => (
          <div key={s.label} style={{ ...panelStyle, padding: 16, textAlign: "center" as const }}>
            <div style={{ fontFamily: fonts.serif, fontSize: 24, color: colors.paperWhite }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: colors.fog, marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...panelStyle, display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={labelStyle}>Profile</div>
          {!editing ? (
            <button
              type="button"
              onClick={() => setEditing(true)}
              style={{ background: "transparent", border: "1px solid " + colors.steel, color: colors.bone, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, cursor: "pointer" }}
            >
              Edit
            </button>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  setRole(agent.role);
                  setGoal(agent.goal);
                  setEditing(false);
                }}
                style={{ background: "transparent", border: "1px solid " + colors.graphite, color: colors.fog, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={save}
                style={{ background: colors.copper, border: "none", color: colors.obsidian, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
              >
                {isPending ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <>
            <div>
              <div style={labelStyle}>Role</div>
              <input style={inputStyle} value={role} onChange={(e) => setRole(e.target.value)} placeholder="e.g. Negotiation" />
            </div>
            <div>
              <div style={labelStyle}>Goal</div>
              <textarea
                style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }}
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="What should this agent be trying to accomplish?"
              />
            </div>
          </>
        ) : (
          <div>
            <div style={labelStyle}>Goal</div>
            <div style={{ fontSize: 14.5, color: colors.bone, marginTop: 6, lineHeight: 1.6 }}>{agent.goal || "—"}</div>
          </div>
        )}

        <div>
          <div style={labelStyle}>Currently</div>
          <div style={{ fontSize: 14.5, color: colors.bone, marginTop: 6, lineHeight: 1.6 }}>{agent.task || "—"}</div>
        </div>
        <div>
          <div style={labelStyle}>Capabilities</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {agent.capabilities.map((c) => {
              const cap = CAPABILITIES.find((x) => x.id === c);
              return (
                <span key={c} style={{ fontSize: 12, color: colors.bone, border: "1px solid " + colors.graphite, borderRadius: 999, padding: "5px 12px" }}>
                  {cap?.label ?? c}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ ...panelStyle, marginTop: 16 }}>
        <div style={{ ...labelStyle, marginBottom: 14 }}>Recent activity</div>
        {activityLog.length === 0 ? (
          <div style={{ fontSize: 13, color: colors.fog, fontStyle: "italic" }}>No activity yet — assign this agent a task and it&apos;ll show up here.</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activityLog.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 13.5 }}>
                <span style={{ color: colors.bone }}>{a.text}</span>
                <span style={{ color: colors.fog, flex: "none" }}>{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
