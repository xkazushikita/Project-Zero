"use server";
import { searchWeb, isFirecrawlConfigured } from "./firecrawl";

const PLATFORM_DOMAINS: [string, string][] = [
  ["instagram.com", "Instagram"],
  ["tiktok.com", "TikTok"],
  ["twitter.com", "X"],
  ["x.com", "X"],
  ["facebook.com", "Facebook"],
  ["youtube.com", "YouTube"],
  ["linkedin.com", "LinkedIn"],
];

// Looks up a brand's official site/profile by name so the creator doesn't have to paste it in.
export async function lookupBrandProfile(name: string): Promise<{ profileUrl: string | null; platform: string | null }> {
  const trimmed = name.trim();
  if (!trimmed || !isFirecrawlConfigured()) return { profileUrl: null, platform: null };

  const hits = await searchWeb(trimmed + " official website", 3);
  const top = hits.find((h) => h.url);
  if (!top?.url) return { profileUrl: null, platform: null };

  let platform: string | null = null;
  try {
    const host = new URL(top.url).hostname.replace(/^www\./, "");
    const match = PLATFORM_DOMAINS.find(([domain]) => host.includes(domain));
    platform = match ? match[1] : null;
  } catch {
    platform = null;
  }

  return { profileUrl: top.url, platform };
}
