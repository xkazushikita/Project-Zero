import type { CreatorProfile } from "@/lib/profile/types";
import { colors, fonts } from "@/lib/theme";

export default function MediaKitView({ profile, name, email }: { profile: CreatorProfile; name: string; email: string | null }) {
  return (
    <div style={{ background: colors.onyx, border: "1px solid " + colors.graphite, borderRadius: 16, padding: 36 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.copper, textTransform: "uppercase", letterSpacing: "-0.02em" }}>
        Media Kit
      </div>
      <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 30, letterSpacing: "0.01em", color: colors.paperWhite, margin: "8px 0 4px" }}>
        {name}
      </h2>
      <div style={{ color: colors.mist, fontSize: 14.5 }}>{profile.niche || "Niche not set yet"}</div>

      {profile.bio && <p style={{ color: colors.bone, fontSize: 15, lineHeight: 1.7, marginTop: 20 }}>{profile.bio}</p>}

      {profile.platforms.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 12 }}>Platforms</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
            {profile.platforms.map((p, i) => (
              <div key={i} style={{ border: "1px solid " + colors.graphite, borderRadius: 10, padding: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: colors.bone }}>{p.platform}</div>
                <div style={{ fontSize: 13, color: colors.mist, marginTop: 2 }}>@{p.handle}</div>
                <div style={{ fontSize: 20, fontFamily: fonts.serif, color: colors.paperWhite, marginTop: 8 }}>
                  {p.followers ? p.followers.toLocaleString() : "—"}
                </div>
                <div style={{ fontSize: 12, color: colors.fog }}>
                  followers{p.engagementRate ? " · " + p.engagementRate + "% engagement" : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(profile.audience.age || profile.audience.geo || profile.audience.gender) && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>Audience</div>
          <div style={{ fontSize: 14, color: colors.bone, lineHeight: 1.7 }}>
            {[profile.audience.age, profile.audience.geo, profile.audience.gender].filter(Boolean).join(" · ")}
          </div>
        </div>
      )}

      {profile.tone && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>Voice & style</div>
          <div style={{ fontSize: 14, color: colors.bone, lineHeight: 1.7 }}>{profile.tone}</div>
        </div>
      )}

      {profile.pastDeals && (
        <div style={{ marginTop: 28 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase", marginBottom: 8 }}>
            Brand partnerships
          </div>
          <div style={{ fontSize: 14, color: colors.bone, lineHeight: 1.7 }}>{profile.pastDeals}</div>
        </div>
      )}

      <div
        style={{
          marginTop: 28,
          paddingTop: 24,
          borderTop: "1px solid " + colors.graphite,
          display: "flex",
          gap: 32,
          flexWrap: "wrap",
        }}
      >
        {profile.rateFloor && (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" }}>Rate floor</div>
            <div style={{ fontSize: 16, color: colors.paperWhite, marginTop: 4 }}>${profile.rateFloor}+ per deliverable</div>
          </div>
        )}
        {email && (
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" }}>Contact</div>
            <div style={{ fontSize: 16, color: colors.paperWhite, marginTop: 4 }}>{email}</div>
          </div>
        )}
      </div>
    </div>
  );
}
