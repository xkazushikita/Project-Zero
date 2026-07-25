import { NextRequest, NextResponse } from "next/server";
import { TOKEN_URL, redirectUriFrom } from "@/lib/tiktok/config";
import { saveTikTokConnection } from "@/lib/tiktok/store";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const savedState = req.cookies.get("tiktok_oauth_state")?.value;
  const origin = req.nextUrl.origin;

  const fail = (reason: string) => {
    const res = NextResponse.redirect(new URL("/profile?tiktok=error&reason=" + encodeURIComponent(reason), origin));
    res.cookies.delete("tiktok_oauth_state");
    return res;
  };

  if (req.nextUrl.searchParams.get("error")) return fail("You cancelled the TikTok connection.");
  if (!code || !state || !savedState || state !== savedState) return fail("That connection request expired — try again.");

  try {
    const tokenRes = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUriFrom(origin),
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokenRes.ok || !tokens.access_token) {
      return fail(tokens.error_description || "TikTok didn't confirm the connection.");
    }

    await saveTikTokConnection(tokens);

    const res = NextResponse.redirect(new URL("/profile?tiktok=connected", origin));
    res.cookies.delete("tiktok_oauth_state");
    return res;
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Something went wrong talking to TikTok.");
  }
}
