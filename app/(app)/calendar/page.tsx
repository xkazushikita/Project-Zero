import { listMeetings } from "@/lib/meetings/store";
import BookMeetingBox from "@/components/calendar/BookMeetingBox";
import CalendarViews from "@/components/calendar/CalendarViews";
import { colors, fonts } from "@/lib/theme";

export default async function CalendarPage() {
  const meetings = await listMeetings();

  return (
    <div style={{ maxWidth: 820 }}>
      <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
        Calendar
      </h1>
      <p style={{ color: colors.mist, fontSize: 14.5, marginTop: 8, marginBottom: 24 }}>
        Only real booked brand calls show up here. Book one by typing it in plain English.
      </p>

      <div style={{ marginBottom: 32 }}>
        <BookMeetingBox />
      </div>

      <CalendarViews meetings={meetings} />
    </div>
  );
}
