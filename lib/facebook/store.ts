"use server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { facebookConnections, creatorProfile } from "@/lib/db/schema";
import { TOKEN_URL, GRAPH_BASE } from "./config";
import type { PlatformEntry } from "@/lib/profile/types";

export interface FacebookConnection {
  pageId: string;
  pageName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  likeCount: number | null;
  connectedAt: string;
  syncedAt: string;
}

export async function getFacebookConnection(): Promise<FacebookConnection | null> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return null;
  const db = getDb()!;
  const rows = await db.select().from(facebookConnections).where(eq(facebookConnections.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    pageId: row.pageId,
    pageName: row.pageName,
    avatarUrl: row.avatarUrl,
    followerCount: row.followerCount,
    likeCount: row.likeCount,
    connectedAt: row.connectedAt.toISOString(),
    syncedAt: row.syncedAt.toISOString(),
  };
}

interface PageInfo {
  id: string;
  name: string;
  access_token: string;
}

interface PageStats {
  name?: string;
  fan_count?: number;
  followers_count?: number;
  picture?: { data?: { url?: string } };
}

async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
  const url = new URL(TOKEN_URL);
  url.searchParams.set("grant_type", "fb_exchange_token");
  url.searchParams.set("client_id", process.env.FACEBOOK_APP_ID!);
  url.searchParams.set("client_secret", process.env.FACEBOOK_APP_SECRET!);
  url.searchParams.set("fb_exchange_token", shortLivedToken);
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.access_token) throw new Error(json.error?.message || "Facebook didn't confirm the connection.");
  return json.access_token as string;
}

async function firstManagedPage(longLivedUserToken: string): Promise<PageInfo | null> {
  const res = await fetch(GRAPH_BASE + "/me/accounts?access_token=" + longLivedUserToken);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Couldn't list your Facebook Pages.");
  const pages = (json.data as PageInfo[]) ?? [];
  return pages[0] ?? null;
}

async function fetchPageStats(pageId: string, pageAccessToken: string): Promise<PageStats> {
  const res = await fetch(
    GRAPH_BASE + "/" + pageId + "?fields=name,fan_count,followers_count,picture.type(large)&access_token=" + pageAccessToken
  );
  const json = await res.json();
  if (!res.ok) throw new Error(json.error?.message || "Couldn't read your Page's stats.");
  return json;
}

// Called once by the OAuth callback right after exchanging the code for a user token.
export async function saveFacebookConnection(shortLivedUserToken: string): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return { ok: false, error: "Not signed in." };
  try {
    const longLivedUserToken = await exchangeForLongLivedToken(shortLivedUserToken);
    const page = await firstManagedPage(longLivedUserToken);
    if (!page) {
      return { ok: false, error: "No Facebook Page found on your account — connect a Page you manage, not just a personal profile." };
    }
    const stats = await fetchPageStats(page.id, page.access_token);
    const db = getDb()!;
    await db
      .insert(facebookConnections)
      .values({
        userId,
        pageId: page.id,
        pageName: stats.name ?? page.name,
        avatarUrl: stats.picture?.data?.url ?? null,
        followerCount: stats.followers_count ?? null,
        likeCount: stats.fan_count ?? null,
        pageAccessToken: page.access_token,
        syncedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: facebookConnections.userId,
        set: {
          pageId: page.id,
          pageName: stats.name ?? page.name,
          avatarUrl: stats.picture?.data?.url ?? null,
          followerCount: stats.followers_count ?? null,
          likeCount: stats.fan_count ?? null,
          pageAccessToken: page.access_token,
          syncedAt: new Date(),
        },
      });

    await syncFollowersIntoMediaKit(userId, stats.name ?? page.name, stats.followers_count ?? null);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Something went wrong talking to Facebook." };
  }
}

async function syncFollowersIntoMediaKit(userId: string, pageName: string | null, followerCount: number | null) {
  const db = getDb()!;
  const rows = await db.select().from(creatorProfile).where(eq(creatorProfile.userId, userId)).limit(1);
  const row = rows[0];
  const platforms: PlatformEntry[] = row ? ((row.platforms as PlatformEntry[]) ?? []) : [];
  const idx = platforms.findIndex((p) => p.platform.toLowerCase() === "facebook");
  const updated: PlatformEntry = {
    platform: "Facebook",
    handle: pageName ?? platforms[idx]?.handle ?? "",
    followers: followerCount,
    engagementRate: idx >= 0 ? platforms[idx].engagementRate : null,
  };
  const nextPlatforms = idx >= 0 ? platforms.map((p, i) => (i === idx ? updated : p)) : [...platforms, updated];

  if (row) {
    await db.update(creatorProfile).set({ platforms: nextPlatforms, updatedAt: new Date() }).where(eq(creatorProfile.userId, userId));
  } else {
    await db.insert(creatorProfile).values({ userId, platforms: nextPlatforms });
  }
}

// Re-pulls follower/like count + photo with the Page token already on file — "Sync now" button.
export async function syncFacebook(): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return { ok: false, error: "Not signed in." };
  const db = getDb()!;
  const rows = await db.select().from(facebookConnections).where(eq(facebookConnections.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "Facebook isn't connected yet." };

  try {
    const stats = await fetchPageStats(row.pageId, row.pageAccessToken);
    await db
      .update(facebookConnections)
      .set({
        pageName: stats.name ?? row.pageName,
        avatarUrl: stats.picture?.data?.url ?? null,
        followerCount: stats.followers_count ?? null,
        likeCount: stats.fan_count ?? null,
        syncedAt: new Date(),
      })
      .where(eq(facebookConnections.userId, userId));
    await syncFollowersIntoMediaKit(userId, stats.name ?? row.pageName, stats.followers_count ?? null);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach Facebook just now — your connection may need to be redone." };
  }
}

export async function disconnectFacebook() {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.delete(facebookConnections).where(eq(facebookConnections.userId, userId));
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
