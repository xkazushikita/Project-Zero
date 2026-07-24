"use client";
import { useState } from "react";
import { colors } from "@/lib/theme";
import MonthView from "./MonthView";
import MeetingRow from "./MeetingRow";
import type { Meeting } from "@/lib/meetings/types";

export default function CalendarViews({ meetings }: { meetings: Meeting[] }) {
  const [view, setView] = useState<"month" | "list">("month");
  const now = new Date();
  const upcoming = meetings.filter((m) => new Date(m.whenAt) >= now);
  const past = meetings
    .filter((m) => new Date(m.whenAt) < now)
    .sort((a, b) => new Date(b.whenAt).getTime() - new Date(a.whenAt).getTime());

  const pill = (active: boolean) =>
    ({
      fontSize: 12.5,
      fontWeight: 600,
      borderRadius: 999,
      padding: "6px 16px",
      cursor: "pointer",
      background: active ? colors.paperWhite : "transparent",
      color: active ? "#000" : colors.bone,
      border: "1px solid " + (active ? colors.paperWhite : colors.steel),
    }) as const;

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button type="button" onClick={() => setView("month")} style={pill(view === "month")}>
          Month
        </button>
        <button type="button" onClick={() => setView("list")} style={pill(view === "list")}>
          List
        </button>
      </div>

      {view === "month" ? (
        <MonthView meetings={meetings} />
      ) : (
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 12 }}>Upcoming</div>
          {upcoming.length === 0 ? (
            <div style={{ border: "1px dashed " + colors.graphite, borderRadius: 10, padding: 20, fontSize: 13.5, color: colors.fog }}>
              Nothing booked yet — try the box above.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {upcoming.map((m) => (
                <MeetingRow key={m.id} meeting={m} />
              ))}
            </div>
          )}

          {past.length > 0 && (
            <>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.fog, textTransform: "uppercase", margin: "28px 0 12px" }}>Past</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {past.map((m) => (
                  <MeetingRow key={m.id} meeting={m} muted />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
