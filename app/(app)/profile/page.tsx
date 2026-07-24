import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { getMyProfile } from "@/lib/profile/store";
import { getTikTokConnection } from "@/lib/tiktok/store";
import { isTikTokConfigured } from "@/lib/tiktok/config";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage({ searchParams }: { searchParams: { tiktok?: string; reason?: string } }) {
  const [profile, tiktok] = await Promise.all([getMyProfile(), getTikTokConnection()]);
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
      tiktokReason={searchParams.reason ?? null}
    />
  );
}
