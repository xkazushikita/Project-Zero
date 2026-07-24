import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { getMyProfile } from "@/lib/profile/store";
import { getTikTokConnection } from "@/lib/tiktok/store";
import { isTikTokConfigured } from "@/lib/tiktok/config";
import { getFacebookConnection } from "@/lib/facebook/store";
import { isFacebookConfigured } from "@/lib/facebook/config";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: { tiktok?: string; facebook?: string; reason?: string };
}) {
  const [profile, tiktok, facebook] = await Promise.all([getMyProfile(), getTikTokConnection(), getFacebookConnection()]);
  const clerkUser = await clerkCurrentUser();
  const name = clerkUser?.firstName
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ")
    : clerkUser?.username ?? "Your profile";
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;

  return (
    <ProfileClient
      profile={profile}
      name={name}
      email={email}
      tiktok={tiktok}
      tiktokConfigured={isTikTokConfigured()}
      tiktokStatus={searchParams.tiktok ?? null}
      tiktokReason={searchParams.tiktok === "error" ? searchParams.reason ?? null : null}
      facebook={facebook}
      facebookConfigured={isFacebookConfigured()}
      facebookStatus={searchParams.facebook ?? null}
      facebookReason={searchParams.facebook === "error" ? searchParams.reason ?? null : null}
    />
  );
}
