import { colors } from "@/lib/theme";

export default function DailyActivityChart({ days }: { days: { label: string; count: number }[] }) {
  const max = Math.max(1, ...days.map((d) => d.count));
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 150 }}>
      {days.map((d, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, minWidth: 0 }}>
          <div style={{ width: "100%", height: 110, display: "flex", alignItems: "flex-end" }} title={d.count + " on " + d.label}>
            <div
              style={{
                width: "100%",
                height: Math.max(3, (d.count / max) * 110),
                background: d.count > 0 ? colors.gildedGradient : colors.graphite,
                borderRadius: 3,
              }}
            />
          </div>
          <div style={{ fontSize: 9.5, color: colors.fog, whiteSpace: "nowrap" }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}
