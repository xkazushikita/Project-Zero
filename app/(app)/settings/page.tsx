import { getNotificationPrefs } from "@/lib/settings/actions";
import NotificationToggle from "@/components/NotificationToggle";
import { colors, fonts } from "@/lib/theme";

export default async function SettingsPage() {
  const prefs = await getNotificationPrefs();

  return (
    <div style={{ maxWidth: 620 }}>
      <h1
        style={{
          fontFamily: fonts.serif,
          fontWeight: 400,
          fontSize: 28,
          letterSpacing: "0.01em",
          color: colors.paperWhite,
          margin: 0,
        }}
      >
        Settings
      </h1>
      <p style={{ color: colors.mist, marginTop: 8, fontSize: 14.5 }}>Choose what you want to hear about.</p>

      <div style={{ marginTop: 28 }}>
        <NotificationToggle
          id="newBrands"
          label="New brands discovered"
          description="When your Research agent finds a brand worth reviewing."
          initial={prefs.newBrands}
        />
        <NotificationToggle
          id="pitchesReady"
          label="Pitches & proposals ready"
          description="When a draft is ready for you to read."
          initial={prefs.pitchesReady}
        />
        <NotificationToggle
          id="dealActivity"
          label="Deal activity"
          description="Replies, stage changes, and follow-ups."
          initial={prefs.dealActivity}
        />
        <NotificationToggle
          id="callsBooked"
          label="Calls booked"
          description="When a brand call gets added to your calendar."
          initial={prefs.callsBooked}
        />
      </div>
    </div>
  );
}
