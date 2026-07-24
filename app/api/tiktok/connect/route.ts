import { NextRequest, NextResponse } from "next/server";
import { isTikTokConfigured, AUTHORIZE_URL, TIKTOK_SCOPES, redirectUriFrom } from "@/lib/tiktok/config";

export async function GET(req: NextRequest) {
  if (!isTikTokConfigured()) {
    return NextResponse.redirect(new URL("/profile?tiktok=not-configured", req.url));
  }

  const state = crypto.randomUUID();
  const origin = req.nextUrl.origin;

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_key", process.env.TIKTOK_CLIENT_KEY!);
  url.searchParams.set("scope", TIKTOK_SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUriFrom(origin));
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("tiktok_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
