"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { activity } from "@/lib/db/schema";

export async function logActivity(input: { agentId?: string | null; leadId?: string | null; type: string; text: string }) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.insert(activity).values({
    userId,
    agentId: input.agentId ?? null,
    leadId: input.leadId ?? null,
    type: input.type,
    text: input.text,
  });
}

export async function listRecentActivity(limit = 10): Promise<{ agentId: string | null; text: string }[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db
    .select({ agentId: activity.agentId, text: activity.text })
    .from(activity)
    .where(eq(activity.userId, userId))
    .orderBy(desc(activity.createdAt))
    .limit(limit);
  return rows;
}
