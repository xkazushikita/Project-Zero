export function isTikTokConfigured(): boolean {
  return Boolean(process.env.TIKTOK_CLIENT_KEY && process.env.TIKTOK_CLIENT_SECRET);
}

export const TIKTOK_SCOPES = "user.info.basic,user.info.stats";
export const AUTHORIZE_URL = "https://www.tiktok.com/v2/auth/authorize/";
export const TOKEN_URL = "https://open.tiktokapis.com/v2/oauth/token/";
export const USER_INFO_URL =
  "https://open.tiktokapis.com/v2/user/info/?fields=open_id,username,display_name,avatar_url,follower_count";

// Redirect URI must exactly match what's registered in the TikTok app, and TikTok
// requires it to be https — so this only ever resolves against the deployed origin.
export function redirectUriFrom(origin: string): string {
  return origin + "/api/tiktok/callback";
}
