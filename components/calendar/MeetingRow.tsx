import Link from "next/link";
import { colors } from "@/lib/theme";
import type { Meeting } from "@/lib/meetings/types";

export default function MeetingRow({ meeting, muted }: { meeting: Meeting; muted?: boolean }) {
  const content = (
    <div
      style={{
        border: "1px solid " + colors.graphite,
        borderRadius: 10,
        padding: "14px 16px",
        background: colors.onyx,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        opacity: muted ? 0.55 : 1,
      }}
    >
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 600, color: colors.bone }}>{meeting.title}</div>
        {meeting.leadName && <div style={{ fontSize: 12.5, color: colors.fog, marginTop: 2 }}>{meeting.leadName}</div>}
      </div>
      <div style={{ fontSize: 13, color: colors.copper, whiteSpace: "nowrap" }}>{meeting.whenLabel}</div>
    </div>
  );

  if (meeting.leadId) {
    return (
      <Link href={"/deals/" + meeting.leadId} style={{ display: "block" }}>
        {content}
      </Link>
    );
  }
  return content;
}
