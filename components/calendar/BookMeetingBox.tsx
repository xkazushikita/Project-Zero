"use client";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { colors } from "@/lib/theme";
import { bookMeetingFromText, bookMeetingManual } from "@/lib/meetings/store";

const inputStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  background: "transparent",
  border: "1px solid " + colors.graphite,
  color: colors.bone,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
};

export default function BookMeetingBox({ leadId, brandName }: { leadId?: string; brandName?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState(brandName ? "Call with " + brandName : "");
  const [manualWhen, setManualWhen] = useState("");

  async function submitText() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    setSuccess(null);
    const res = await bookMeetingFromText(text.trim(), leadId);
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Couldn't book that.");
      setShowManual(true);
      return;
    }
    setSuccess(
      "Booked: " +
        res.meeting?.title +
        " — " +
        res.meeting?.whenLabel +
        (res.conflict ? " ⚠️ Heads up — you also have \"" + res.conflict.title + "\" around " + res.conflict.whenLabel + "." : "")
    );
    setText("");
    router.refresh();
  }

  async function submitManual() {
    if (!manualTitle.trim() || !manualWhen || busy) return;
    setBusy(true);
    setError(null);
    const res = await bookMeetingManual({ title: manualTitle.trim(), whenAt: manualWhen, leadId });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    setSuccess("Booked." + (res.conflict ? " ⚠️ Heads up — you also have \"" + res.conflict.title + "\" around " + res.conflict.whenLabel + "." : ""));
    setManualWhen("");
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 220 }}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitText();
          }}
          placeholder={leadId ? "e.g. next Tuesday at 2pm" : "e.g. book a call with Acme next Tuesday at 2pm"}
        />
        <button
          type="button"
          onClick={submitText}
          disabled={busy || !text.trim()}
          style={{
            background: colors.paperWhite,
            color: "#000",
            border: "none",
            borderRadius: 999,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            opacity: busy || !text.trim() ? 0.6 : 1,
          }}
        >
          {busy ? "Booking…" : "Book"}
        </button>
      </div>

      {error && (
        <div style={{ color: colors.errorRed, fontSize: 12.5, marginTop: 10 }}>
          {error}{" "}
          {!showManual && (
            <button
              type="button"
              onClick={() => setShowManual(true)}
              style={{ background: "none", border: "none", color: colors.copper, cursor: "pointer", textDecoration: "underline", padding: 0, fontSize: 12.5 }}
            >
              Enter it manually
            </button>
          )}
        </div>
      )}
      {success && <div style={{ color: colors.sage, fontSize: 12.5, marginTop: 10 }}>{success}</div>}

      {showManual && (
        <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ ...inputStyle, flex: 1, minWidth: 180 }}
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Title, e.g. Call with Acme"
          />
          <input style={inputStyle} type="datetime-local" value={manualWhen} onChange={(e) => setManualWhen(e.target.value)} />
          <button
            type="button"
            onClick={submitManual}
            disabled={busy || !manualTitle.trim() || !manualWhen}
            style={{
              background: "transparent",
              border: "1px solid " + colors.steel,
              color: colors.bone,
              borderRadius: 999,
              padding: "9px 18px",
              fontSize: 13.5,
              cursor: "pointer",
              opacity: busy || !manualTitle.trim() || !manualWhen ? 0.6 : 1,
            }}
          >
            Book manually
          </button>
        </div>
      )}
    </div>
  );
}
