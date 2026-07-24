export default function AgentAvatar({
  avatarUrl,
  color,
  initials,
  size,
  border,
}: {
  avatarUrl?: string | null;
  color: string;
  initials: string;
  size: number;
  border?: string;
}) {
  const base: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "50%",
    flex: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: Math.round(size * 0.37),
    border,
  };
  if (avatarUrl) {
    return <img src={avatarUrl} alt={initials} style={{ ...base, objectFit: "cover" }} />;
  }
  return (
    <div style={{ ...base, background: color, color: "#fff" }}>{initials}</div>
  );
}
