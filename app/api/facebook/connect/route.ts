import { NextRequest, NextResponse } from "next/server";
import { isFacebookConfigured, AUTHORIZE_URL, FACEBOOK_SCOPES, redirectUriFrom } from "@/lib/facebook/config";

export async function GET(req: NextRequest) {
  if (!isFacebookConfigured()) {
    return NextResponse.redirect(new URL("/profile?facebook=not-configured", req.url));
  }

  const state = crypto.randomUUID();
  const origin = req.nextUrl.origin;

  const url = new URL(AUTHORIZE_URL);
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
  url.searchParams.set("scope", FACEBOOK_SCOPES);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", redirectUriFrom(origin));
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("facebook_oauth_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  return res;
}
