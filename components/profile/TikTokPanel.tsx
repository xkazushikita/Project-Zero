"use client";
import { useState, useTransition } from "react";
import { colors, fonts } from "@/lib/theme";
import { syncTikTok, disconnectTikTok } from "@/lib/tiktok/store";
import type { TikTokConnection } from "@/lib/tiktok/store";

function formatFollowers(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

export default function TikTokPanel({
  connection,
  configured,
  status,
  reason,
}: {
  connection: TikTokConnection | null;
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
        <div style={labelStyle}>TikTok</div>
        {connection && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              disabled={isPending}
              onClick={() =>
                startTransition(() => {
                  syncTikTok();
                })
              }
              style={{ background: "transparent", border: "1px solid " + colors.steel, color: colors.bone, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, cursor: "pointer" }}
            >
              {isPending ? "Syncing…" : "Sync now"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => startTransition(() => disconnectTikTok())}
              style={{ background: "transparent", border: "1px solid " + colors.graphite, color: colors.errorRed, borderRadius: 999, padding: "5px 14px", fontSize: 12.5, cursor: "pointer" }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {!dismissed && status === "connected" && (
        <div style={{ fontSize: 13, color: colors.sage, marginBottom: 14 }}>TikTok connected — your follower count and photo are live now.</div>
      )}
      {!dismissed && status === "error" && (
        <div style={{ fontSize: 13, color: colors.errorRed, marginBottom: 14 }}>Couldn't connect TikTok: {reason || "something went wrong."}</div>
      )}
      {!dismissed && status === "not-configured" && (
        <div style={{ fontSize: 13, color: colors.errorRed, marginBottom: 14 }}>TikTok isn't set up on this deployment yet.</div>
      )}

      {connection ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {connection.avatarUrl && (
            <img src={connection.avatarUrl} alt={connection.displayName ?? "TikTok avatar"} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", flex: "none" }} />
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: colors.paperWhite }}>{connection.displayName || connection.username || "Connected"}</div>
            <div style={{ fontSize: 13, color: colors.fog, marginTop: 2 }}>
              {connection.username ? "@" + connection.username + " · " : ""}
              {formatFollowers(connection.followerCount)} followers
            </div>
          </div>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 13.5, color: colors.mist, lineHeight: 1.5, marginBottom: 14 }}>
            Connect your TikTok to pull in your real follower count and profile photo automatically — no more typing it in by hand.
          </div>
          <a
            href="/api/tiktok/connect"
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
            {configured ? "Connect TikTok" : "Connect TikTok (setting up…)"}
          </a>
        </>
      )}
    </div>
  );
}
