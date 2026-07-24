"use client";
import { useState } from "react";
import { colors } from "@/lib/theme";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  if (open) {
    return (
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          if (!query) setOpen(false);
        }}
        placeholder="Search brands, agents, deals…"
        style={{
          width: "min(360px, 60vw)",
          padding: "9px 16px",
          borderRadius: 999,
          background: "transparent",
          border: "1px solid " + colors.paperWhite,
          color: colors.bone,
          fontSize: 14,
          outline: "none",
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        borderRadius: 999,
        background: "transparent",
        border: "1px solid " + colors.steel,
        color: colors.fog,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
      Search
    </button>
  );
}
