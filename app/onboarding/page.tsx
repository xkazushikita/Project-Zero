import { redirect } from "next/navigation";
import { currentUser } from "@/lib/auth/currentUser";
import { getMyProfile } from "@/lib/profile/store";
import ProfileForm from "@/components/profile/ProfileForm";
import { colors, fonts } from "@/lib/theme";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  const profile = await getMyProfile();

  return (
    <div style={{ minHeight: "100dvh", background: colors.obsidian, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: fonts.serif, fontSize: 22, fontWeight: 500, letterSpacing: "0.01em", color: colors.paperWhite }}>
          Agentic Sales Team
        </div>
        <p style={{ color: colors.mist, marginTop: 8, fontSize: 14.5 }}>
          A few questions so your team can pitch as the real you.
        </p>
      </div>
      <ProfileForm mode="wizard" initial={profile} />
    </div>
  );
}
