import { SignUp } from "@clerk/nextjs";
import { colors } from "@/lib/theme";

export default function SignUpPage() {
  return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: colors.obsidian }}>
      <SignUp />
    </div>
  );
}
