import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { getMyProfile } from "@/lib/profile/store";
import ProfileClient from "@/components/profile/ProfileClient";

export default async function ProfilePage() {
  const profile = await getMyProfile();
  const clerkUser = await clerkCurrentUser();
  const name = clerkUser?.firstName
    ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ")
    : clerkUser?.username ?? "Your profile";
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;

  return <ProfileClient profile={profile} name={name} email={email} />;
}
