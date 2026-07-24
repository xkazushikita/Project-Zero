import { colors, fonts } from "@/lib/theme";

export interface StatTile {
  value: number;
  label: string;
}

export default function StatTiles({ tiles }: { tiles: StatTile[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 24 }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          className="asteam-stat-tile"
          style={{ border: "1px solid " + colors.graphite, borderRadius: 10, padding: "16px 18px", background: colors.onyx }}
        >
          <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, lineHeight: 1 }}>
            {t.value}
          </div>
          <div style={{ fontSize: 12.5, color: colors.fog, marginTop: 8 }}>{t.label}</div>
        </div>
      ))}
    </div>
  );
}
