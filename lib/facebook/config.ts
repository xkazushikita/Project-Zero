export function isFacebookConfigured(): boolean {
  return Boolean(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET);
}

const GRAPH_VERSION = "v21.0";
// public_profile: name + photo. pages_show_list / pages_read_engagement: which Pages you
// manage, and their follower/like counts — only available for Pages, never personal profiles.
export const FACEBOOK_SCOPES = "public_profile,pages_show_list,pages_read_engagement";
export const AUTHORIZE_URL = "https://www.facebook.com/" + GRAPH_VERSION + "/dialog/oauth";
export const TOKEN_URL = "https://graph.facebook.com/" + GRAPH_VERSION + "/oauth/access_token";
export const GRAPH_BASE = "https://graph.facebook.com/" + GRAPH_VERSION;

// Redirect URI must exactly match what's registered in the Meta app, and Facebook Login
// requires it to be https — so this only ever resolves against the deployed origin.
export function redirectUriFrom(origin: string): string {
  return origin + "/api/facebook/callback";
}
