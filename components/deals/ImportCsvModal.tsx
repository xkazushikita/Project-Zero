"use client";
import { useRef, useState, useTransition } from "react";
import { colors, fonts } from "@/lib/theme";
import { importLeadsCsv } from "@/lib/leads/store";

export default function ImportCsvModal({ onClose }: { onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [result, setResult] = useState<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setCsvText(await file.text());
    setResult(null);
  }

  function submit() {
    if (!csvText) return;
    startTransition(async () => {
      const { imported } = await importLeadsCsv(csvText);
      setResult(imported);
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
        <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 22, color: colors.paperWhite, margin: "0 0 12px" }}>Import a list</h2>
        <p style={{ fontSize: 13.5, color: colors.mist, marginBottom: 20, lineHeight: 1.6 }}>
          A CSV with columns like <b style={{ color: colors.bone }}>name</b>, <b style={{ color: colors.bone }}>company</b>,{" "}
          <b style={{ color: colors.bone }}>email</b>, and <b style={{ color: colors.bone }}>platform</b>. Close enough header names work too.
        </p>

        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          style={{
            width: "100%",
            border: "1px dashed " + colors.steel,
            borderRadius: 10,
            padding: "24px 16px",
            background: "transparent",
            color: colors.bone,
            fontSize: 13.5,
            cursor: "pointer",
          }}
        >
          {fileName ? "Selected: " + fileName : "Click to choose a .csv file"}
        </button>
        <input ref={fileInput} type="file" accept=".csv,text/csv" onChange={onFileChange} style={{ display: "none" }} />

        {result !== null && (
          <div style={{ marginTop: 14, fontSize: 13.5, color: colors.sage }}>
            Imported {result} brand{result === 1 ? "" : "s"}.
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 26 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ background: "transparent", border: "1px solid " + colors.steel, color: colors.bone, borderRadius: 999, padding: "9px 18px", fontSize: 13.5, cursor: "pointer" }}
          >
            {result !== null ? "Done" : "Cancel"}
          </button>
          {result === null && (
            <button
              type="button"
              onClick={submit}
              disabled={isPending || !csvText}
              style={{
                background: colors.paperWhite,
                color: "#000",
                border: "none",
                borderRadius: 999,
                padding: "9px 20px",
                fontSize: 13.5,
                fontWeight: 500,
                cursor: "pointer",
                opacity: !csvText ? 0.5 : 1,
              }}
            >
              {isPending ? "Importing…" : "Import"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
