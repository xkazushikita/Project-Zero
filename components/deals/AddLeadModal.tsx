"use client";
import { useState, useTransition } from "react";
import type { CSSProperties } from "react";
import { colors, fonts } from "@/lib/theme";
import { addLead } from "@/lib/leads/store";
import { lookupBrandProfile } from "@/lib/discovery/actions";
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

export default function AddLeadModal({ agents, onClose }: { agents: AppAgent[]; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [agentId, setAgentId] = useState("");
  const [autoFilling, setAutoFilling] = useState(false);
  const [autoFilled, setAutoFilled] = useState(false);

  async function autoFillFromName() {
    if (!name.trim() || profileUrl.trim()) return;
    setAutoFilling(true);
    const result = await lookupBrandProfile(name.trim());
    if (result.profileUrl) {
      setProfileUrl(result.profileUrl);
      setAutoFilled(true);
    }
    if (result.platform && !platform.trim()) setPlatform(result.platform);
    setAutoFilling(false);
  }

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      await addLead({
        name: name.trim(),
        company: company.trim(),
        email: email.trim(),
        platform: platform.trim(),
        profileUrl: profileUrl.trim(),
        agentId,
      });
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
        style={{ width: "min(440px, 100%)", background: colors.onyx, border: "1px solid " + colors.graphite, borderRadius: 16, padding: 30 }}
      >
        <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 22, color: colors.paperWhite, margin: "0 0 20px" }}>Add a brand</h2>

        <label style={labelStyle}>Name</label>
        <input
          style={inputStyle}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setAutoFilled(false);
          }}
          onBlur={autoFillFromName}
          placeholder="e.g. Glow Skincare"
        />

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Company (optional)</label>
          <input style={inputStyle} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Parent company, if different" />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Email (optional)</label>
          <input style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="partnerships@brand.com" />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Platform / profile (optional)</label>
          <input style={inputStyle} value={platform} onChange={(e) => setPlatform(e.target.value)} placeholder="e.g. Instagram @glowskincare" />
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Profile or website link</label>
          <input
            style={inputStyle}
            value={profileUrl}
            onChange={(e) => {
              setProfileUrl(e.target.value);
              setAutoFilled(false);
            }}
            placeholder="Found automatically from the name — or paste your own"
          />
          {autoFilling && <div style={{ fontSize: 12, color: colors.fog, marginTop: 6 }}>Looking it up…</div>}
          {autoFilled && !autoFilling && <div style={{ fontSize: 12, color: colors.sage, marginTop: 6 }}>Found automatically — edit if it&apos;s wrong.</div>}
        </div>

        <div style={{ marginTop: 14 }}>
          <label style={labelStyle}>Assign to (optional)</label>
          <select style={inputStyle} value={agentId} onChange={(e) => setAgentId(e.target.value)}>
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
            disabled={isPending || !name.trim()}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "9px 20px",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
              opacity: !name.trim() ? 0.5 : 1,
            }}
          >
            {isPending ? "Adding…" : "Add brand"}
          </button>
        </div>
      </div>
    </div>
  );
}
