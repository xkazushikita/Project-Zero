import { SignIn } from "@clerk/nextjs";
import { colors } from "@/lib/theme";

export default function SignInPage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.obsidian }}>
      <SignIn />
    </div>
  );
}
