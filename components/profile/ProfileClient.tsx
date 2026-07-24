"use client";
import { useState } from "react";
import ProfileForm from "./ProfileForm";
import MediaKitView from "./MediaKitView";
import TikTokPanel from "./TikTokPanel";
import FacebookPanel from "./FacebookPanel";
import type { CreatorProfile } from "@/lib/profile/types";
import type { TikTokConnection } from "@/lib/tiktok/store";
import type { FacebookConnection } from "@/lib/facebook/store";
import { colors, fonts } from "@/lib/theme";

export default function ProfileClient({
  profile,
  name,
  email,
  tiktok,
  tiktokConfigured,
  tiktokStatus,
  tiktokReason,
  facebook,
  facebookConfigured,
  facebookStatus,
  facebookReason,
}: {
  profile: CreatorProfile | null;
  name: string;
  email: string | null;
  tiktok: TikTokConnection | null;
  tiktokConfigured: boolean;
  tiktokStatus: string | null;
  tiktokReason: string | null;
  facebook: FacebookConnection | null;
  facebookConfigured: boolean;
  facebookStatus: string | null;
  facebookReason: string | null;
}) {
  const [editing, setEditing] = useState(!profile);

  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, gap: 12, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
          Profile
        </h1>
        {profile && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            style={{
              background: "transparent",
              border: "1px solid " + colors.steel,
              color: colors.bone,
              borderRadius: 999,
              padding: "8px 18px",
              fontSize: 13.5,
              cursor: "pointer",
            }}
          >
            {editing ? "View profile" : "Edit profile"}
          </button>
        )}
      </div>
      <TikTokPanel connection={tiktok} configured={tiktokConfigured} status={tiktokStatus} reason={tiktokReason} />
      <FacebookPanel connection={facebook} configured={facebookConfigured} status={facebookStatus} reason={facebookReason} />
      {editing ? <ProfileForm mode="edit" initial={profile} /> : <MediaKitView profile={profile as CreatorProfile} name={name} email={email} />}
    </div>
  );
}
