import { colors, fonts } from "@/lib/theme";

export default function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ maxWidth: 560 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: colors.copper,
          textTransform: "uppercase",
          marginBottom: 10,
        }}
      >
        Coming soon
      </div>
      <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 30, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
        {title}
      </h1>
      <p style={{ color: colors.mist, marginTop: 12, fontSize: 15, lineHeight: 1.6 }}>{description}</p>
    </div>
  );
}
