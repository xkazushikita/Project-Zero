"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc, asc, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
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

export interface Notification {
  id: string;
  agentId: string | null;
  text: string;
  createdAt: string;
}

// Only undismissed items — dismissing only ever hides from this bell.
// Analytics and the dashboard read the raw activity log, so clearing here never drops a metric.
export async function listNotifications(limit = 20): Promise<Notification[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db
    .select({ id: activity.id, agentId: activity.agentId, text: activity.text, createdAt: activity.createdAt })
    .from(activity)
    .where(and(eq(activity.userId, userId), eq(activity.dismissed, false)))
    .orderBy(desc(activity.createdAt))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, agentId: r.agentId, text: r.text, createdAt: r.createdAt.toISOString() }));
}

export async function dismissNotification(id: string) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.update(activity).set({ dismissed: true }).where(and(eq(activity.id, id), eq(activity.userId, userId)));
  revalidatePath("/", "layout");
}

export interface ActivityLogEntry {
  agentId: string | null;
  type: string;
  createdAt: string;
}

// Raw log for analytics — always the full, unfiltered history within the window,
// regardless of what's been dismissed from the notification bell.
export async function listActivityForAnalytics(days = 14): Promise<ActivityLogEntry[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({ agentId: activity.agentId, type: activity.type, createdAt: activity.createdAt })
    .from(activity)
    .where(and(eq(activity.userId, userId), gte(activity.createdAt, since)))
    .orderBy(asc(activity.createdAt));
  return rows.map((r) => ({ agentId: r.agentId, type: r.type, createdAt: r.createdAt.toISOString() }));
}

export interface AgentActivityEntry {
  id: string;
  text: string;
  createdAt: string;
}

export async function listActivityForAgent(agentId: string, limit = 20): Promise<AgentActivityEntry[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db
    .select({ id: activity.id, text: activity.text, createdAt: activity.createdAt })
    .from(activity)
    .where(and(eq(activity.userId, userId), eq(activity.agentId, agentId)))
    .orderBy(desc(activity.createdAt))
    .limit(limit);
  return rows.map((r) => ({ id: r.id, text: r.text, createdAt: r.createdAt.toISOString() }));
}

export async function dismissAllNotifications() {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.update(activity).set({ dismissed: true }).where(and(eq(activity.userId, userId), eq(activity.dismissed, false)));
  revalidatePath("/", "layout");
}
