"use server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { creatorProfile } from "@/lib/db/schema";
import type { CreatorProfile, PlatformEntry, Audience } from "./types";

export async function getMyProfile(): Promise<CreatorProfile | null> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return null;
  const db = getDb()!;
  const rows = await db.select().from(creatorProfile).where(eq(creatorProfile.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;
  return {
    userId,
    niche: row.niche ?? "",
    bio: row.bio ?? "",
    platforms: (row.platforms as PlatformEntry[]) ?? [],
    audience: (row.audience as Audience) ?? {},
    tone: row.tone ?? "",
    pastDeals: row.pastDeals ?? "",
    rateFloor: row.rateFloor ?? null,
  };
}

export async function saveMyProfile(input: Omit<CreatorProfile, "userId">) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .insert(creatorProfile)
    .values({
      userId,
      niche: input.niche,
      bio: input.bio,
      platforms: input.platforms,
      audience: input.audience,
      tone: input.tone,
      pastDeals: input.pastDeals,
      rateFloor: input.rateFloor,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: creatorProfile.userId,
      set: {
        niche: input.niche,
        bio: input.bio,
        platforms: input.platforms,
        audience: input.audience,
        tone: input.tone,
        pastDeals: input.pastDeals,
        rateFloor: input.rateFloor,
        updatedAt: new Date(),
      },
    });
  revalidatePath("/profile");
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
}
