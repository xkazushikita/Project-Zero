"use server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { tiktokConnections, creatorProfile } from "@/lib/db/schema";
import { TOKEN_URL, USER_INFO_URL } from "./config";
import type { PlatformEntry } from "@/lib/profile/types";

export interface TikTokConnection {
  username: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  connectedAt: string;
  syncedAt: string;
}

export async function getTikTokConnection(): Promise<TikTokConnection | null> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return null;
  const db = getDb()!;
  const rows = await db.select().from(tiktokConnections).where(eq(tiktokConnections.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    followerCount: row.followerCount,
    connectedAt: row.connectedAt.toISOString(),
    syncedAt: row.syncedAt.toISOString(),
  };
}

interface TikTokUserInfo {
  open_id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  follower_count?: number;
}

async function fetchTikTokUserInfo(accessToken: string): Promise<TikTokUserInfo> {
  const res = await fetch(USER_INFO_URL, {
    headers: { Authorization: "Bearer " + accessToken },
  });
  const json = await res.json();
  if (!res.ok || json.error?.code === "error") {
    throw new Error(json.error?.message || "TikTok didn't return profile info");
  }
  return json.data.user as TikTokUserInfo;
}

// Called once by the OAuth callback right after exchanging the code for tokens.
export async function saveTikTokConnection(tokens: { access_token: string; refresh_token?: string; expires_in?: number }) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  const info = await fetchTikTokUserInfo(tokens.access_token);
  const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null;

  await db
    .insert(tiktokConnections)
    .values({
      userId,
      openId: info.open_id,
      username: info.username ?? null,
      displayName: info.display_name ?? null,
      avatarUrl: info.avatar_url ?? null,
      followerCount: info.follower_count ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      expiresAt,
      syncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: tiktokConnections.userId,
      set: {
        openId: info.open_id,
        username: info.username ?? null,
        displayName: info.display_name ?? null,
        avatarUrl: info.avatar_url ?? null,
        followerCount: info.follower_count ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt,
        syncedAt: new Date(),
      },
    });

  await syncFollowersIntoMediaKit(userId, info.username ?? null, info.follower_count ?? null);
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}

// Keeps the Media Kit's TikTok row (used by every AI pitch engine) in step with the real numbers.
async function syncFollowersIntoMediaKit(userId: string, username: string | null, followerCount: number | null) {
  const db = getDb()!;
  const rows = await db.select().from(creatorProfile).where(eq(creatorProfile.userId, userId)).limit(1);
  const row = rows[0];
  const platforms: PlatformEntry[] = row ? ((row.platforms as PlatformEntry[]) ?? []) : [];
  const idx = platforms.findIndex((p) => p.platform.toLowerCase() === "tiktok");
  const updated: PlatformEntry = {
    platform: "TikTok",
    handle: username ? "@" + username : platforms[idx]?.handle ?? "",
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

// Re-pulls follower count + avatar with the token already on file — used by the "Sync now" button.
export async function syncTikTok(): Promise<{ ok: boolean; error?: string }> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return { ok: false, error: "Not signed in." };
  const db = getDb()!;
  const rows = await db.select().from(tiktokConnections).where(eq(tiktokConnections.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return { ok: false, error: "TikTok isn't connected yet." };

  let accessToken = row.accessToken;
  if (row.expiresAt && row.expiresAt.getTime() < Date.now() && row.refreshToken) {
    const refreshed = await refreshAccessToken(row.refreshToken);
    if (!refreshed) return { ok: false, error: "Your TikTok connection expired — reconnect it below." };
    accessToken = refreshed.access_token;
    await db
      .update(tiktokConnections)
      .set({
        accessToken: refreshed.access_token,
        refreshToken: refreshed.refresh_token ?? row.refreshToken,
        expiresAt: refreshed.expires_in ? new Date(Date.now() + refreshed.expires_in * 1000) : row.expiresAt,
      })
      .where(eq(tiktokConnections.userId, userId));
  }

  try {
    const info = await fetchTikTokUserInfo(accessToken);
    await db
      .update(tiktokConnections)
      .set({
        username: info.username ?? null,
        displayName: info.display_name ?? null,
        avatarUrl: info.avatar_url ?? null,
        followerCount: info.follower_count ?? null,
        syncedAt: new Date(),
      })
      .where(eq(tiktokConnections.userId, userId));
    await syncFollowersIntoMediaKit(userId, info.username ?? null, info.follower_count ?? null);
    revalidatePath("/profile");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch {
    return { ok: false, error: "Couldn't reach TikTok just now — try again shortly." };
  }
}

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string; expires_in?: number } | null> {
  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.access_token) return null;
    return json;
  } catch {
    return null;
  }
}

export async function disconnectTikTok() {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.delete(tiktokConnections).where(eq(tiktokConnections.userId, userId));
  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
