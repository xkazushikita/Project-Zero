"use client";
import { useState, useTransition } from "react";
import { colors } from "@/lib/theme";
import { syncFacebook, disconnectFacebook } from "@/lib/facebook/store";
import type { FacebookConnection } from "@/lib/facebook/store";

function formatCount(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function FacebookPanel({
  connection,
  configured,
  status,
  reason,
}: {
  connection: FacebookConnection | null;
  configured: boolean;
  status: string | null;
  reason: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [dismissed, setDismissed] = useState(false);

  const panelStyle = { border: "1px solid " + colors.graphite, borderRadius: 12, padding: 22, background: colors.onyx, marginBottom: 24 } as const;
  const labelStyle = { fontSize: 12.5, fontWeight: 600, color: colors.fog, textTransform: "uppercase" as const };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: connection ? 16 : 4 }}>
        <div style={labelStyle}>Facebook</div>
        {connection && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  syncFacebook();
                })
              }
              style={{ background: "transparent", border: "1px solid " + colors.steel, color: colors.bone, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, cursor: "pointer" }}
            >
              {isPending ? "Syncing…" : "Sync now"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  disconnectFacebook();
                })
              }
              style={{ background: "transparent", border: "1px solid " + colors.graphite, color: colors.errorRed, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, cursor: "pointer" }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {!dismissed && status === "connected" && (
        <div style={{ fontSize: 13, color: colors.sage, marginBottom: 14 }}>Facebook Page connected — your follower count and photo are live now.</div>
      )}
      {!dismissed && status === "error" && (
        <div style={{ fontSize: 13, color: colors.errorRed, marginBottom: 14 }}>Couldn't connect Facebook: {reason || "something went wrong."}</div>
      )}
      {!dismissed && status === "not-configured" && (
        <div style={{ fontSize: 13, color: colors.errorRed, marginBottom: 14 }}>Facebook isn't set up on this deployment yet.</div>
      )}

      {connection ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {connection.avatarUrl && (
            <img src={connection.avatarUrl} alt={connection.pageName ?? "Facebook Page"} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.paperWhite }}>{connection.pageName || "Connected Page"}</div>
            <div style={{ fontSize: 13, color: colors.fog, marginTop: 2 }}>
              {formatCount(connection.followerCount)} followers · {formatCount(connection.likeCount)} likes
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: colors.mist, lineHeight: 1.5, marginBottom: 14 }}>
            Connect a Facebook Page you manage to pull in real follower and like counts, plus your Page photo — automatically.
          </div>
          <a
            href="/api/facebook/connect"
            style={{
              display: "inline-block",
              background: configured ? colors.copper : colors.graphite,
              color: configured ? colors.obsidian : colors.fog,
              borderRadius: 999,
              padding: "9px 20px",
              fontSize: 13.5,
              fontWeight: 600,
              textDecoration: "none",
              pointerEvents: configured ? "auto" : "none",
            }}
          >
            {configured ? "Connect Facebook" : "Connect Facebook (setting up…)"}
          </a>
        </>
      )}
    </div>
  );
}
