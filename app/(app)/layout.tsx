import { redirect } from "next/navigation";
import { currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { currentUser } from "@/lib/auth/currentUser";
import { getMyProfile } from "@/lib/profile/store";
import { isProfileComplete } from "@/lib/profile/types";
import { isDbConfigured } from "@/lib/db";
import { listNotifications } from "@/lib/activity/store";
import AppFrame from "@/components/AppFrame";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // No database yet? Skip the onboarding gate entirely — the app still runs, just without saving.
  if (isDbConfigured()) {
    const profile = await getMyProfile();
    if (!isProfileComplete(profile)) redirect("/onboarding");
  }

  const [clerkUser, notifications] = await Promise.all([clerkCurrentUser(), listNotifications()]);
  const displayName =
    clerkUser?.firstName || clerkUser?.username || clerkUser?.emailAddresses?.[0]?.emailAddress || "there";

  return (
    <AppFrame userName={displayName} initialNotifications={notifications}>
      {children}
    </AppFrame>
  );
}
