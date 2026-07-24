import { NextRequest, NextResponse } from "next/server";
import { TOKEN_URL, redirectUriFrom } from "@/lib/facebook/config";
import { saveFacebookConnection } from "@/lib/facebook/store";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("facebook_oauth_state")?.value;
  const origin = req.nextUrl.origin;

  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL("/profile?facebook=error&reason=" + encodeURIComponent(reason), origin));
    res.cookies.delete("facebook_oauth_state");
    return res;
  };

  if (req.nextUrl.searchParams.get("error")) return fail("You cancelled the Facebook connection.");
  if (!code || !state || !savedState || state !== savedState) return fail("That connection request expired — try again.");

  try {
    const url = new URL(TOKEN_URL);
    url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
    url.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET!);
    url.searchParams.set("redirect_uri", redirectUriFrom(origin));
    url.searchParams.set("code", code);
    const tokenRes = await fetch(url);
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      return fail(tokens.error?.message || "Facebook didn't confirm the connection.");
    }

    const result = await saveFacebookConnection(tokens.access_token);
    if (!result.ok) return fail(result.error || "Something went wrong saving the connection.");

    const res = NextResponse.redirect(new URL("/profile?facebook=connected", origin));
    res.cookies.delete("facebook_oauth_state");
    return res;
  } catch {
    return fail("Something went wrong talking to Facebook.");
  }
}
