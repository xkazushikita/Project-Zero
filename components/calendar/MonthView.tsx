"use client";
import { useState } from "react";
import Link from "next/link";
import { colors, fonts } from "@/lib/theme";
import type { Meeting } from "@/lib/meetings/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfGrid(d: Date) {
  const first = startOfMonth(d);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());
  return start;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function MonthView({ meetings }: { meetings: Meeting[] }) {
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const today = new Date();

  const gridStart = startOfGrid(cursor);
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });

  const byDay = new Map<string, Meeting[]>();
  for (const m of meetings) {
    const d = new Date(m.whenAt);
    const key = d.toDateString();
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(m);
  }

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 20, letterSpacing: "0.01em", color: colors.paperWhite }}>
          {monthLabel}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => setCursor(startOfMonth(new Date()))} style={navButtonStyle}>
            Today
          </button>
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            style={navButtonStyle}
          >
            ←
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            style={navButtonStyle}
          >
            →
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 1, background: colors.graphite, border: "1px solid " + colors.graphite, borderRadius: 10, overflow: "hidden" }}>
        {WEEKDAYS.map((w) => (
          <div key={w} style={{ background: colors.carbon, padding: "8px 6px", fontSize: 11, fontWeight: 600, color: colors.fog, textAlign: "center", textTransform: "uppercase" }}>
            {w}
          </div>
        ))}
        {days.map((d, i) => {
          const inMonth = d.getMonth() === cursor.getMonth();
          const isToday = sameDay(d, today);
          const dayMeetings = byDay.get(d.toDateString()) ?? [];
          return (
            <div
              key={i}
              style={{
                background: colors.onyx,
                minHeight: 90,
                padding: 6,
                opacity: inMonth ? 1 : 0.35,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  fontSize: 11.5,
                  fontWeight: isToday ? 700 : 500,
                  color: isToday ? "#000" : colors.bone,
                  background: isToday ? colors.copper : "transparent",
                }}
              >
                {d.getDate()}
              </div>
              <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 3 }}>
                {dayMeetings.slice(0, 3).map((m) =>
                  m.leadId ? (
                    <Link key={m.id} href={"/deals/" + m.leadId} style={chipStyle} title={m.title}>
                      {m.title}
                    </Link>
                  ) : (
                    <div key={m.id} style={chipStyle} title={m.title}>
                      {m.title}
                    </div>
                  )
                )}
                {dayMeetings.length > 3 && <div style={{ fontSize: 10.5, color: colors.fog }}>+{dayMeetings.length - 3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navButtonStyle = {
  background: "transparent",
  border: "1px solid " + colors.steel,
  color: colors.bone,
  borderRadius: 999,
  padding: "6px 14px",
  fontSize: 12.5,
  cursor: "pointer",
} as const;

const chipStyle = {
  display: "block",
  fontSize: 10.5,
  fontWeight: 500,
  color: colors.bone,
  background: "rgba(204,145,102,.15)",
  border: "1px solid rgba(204,145,102,.3)",
  borderRadius: 4,
  padding: "2px 5px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
} as const;
