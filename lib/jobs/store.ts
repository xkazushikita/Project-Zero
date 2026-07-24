"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { jobs } from "@/lib/db/schema";

export async function enqueueResearchJob(leadId: string, agentId: string | null): Promise<string | null> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return null;
  const db = getDb()!;
  const [row] = await db
    .insert(jobs)
    .values({ userId, agentId, kind: "research", params: { leadId }, status: "queued" })
    .returning({ id: jobs.id });
  return row.id;
}

// Lightweight "is this agent doing something right now" tracking for tasks that
// run synchronously (discovery, chat-triggered research, booking) — not the
// queued batch runner, just a marker so the dashboard can show a live pulse.
export async function trackJobStart(kind: string, agentId: string | null): Promise<string | null> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return null;
  const db = getDb()!;
  const [row] = await db.insert(jobs).values({ userId, agentId, kind, status: "running", startedAt: new Date() }).returning({ id: jobs.id });
  return row.id;
}

export async function trackJobFinish(jobId: string | null, status: "done" | "failed" = "done") {
  if (!jobId) return;
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.update(jobs).set({ status, finishedAt: new Date() }).where(and(eq(jobs.id, jobId), eq(jobs.userId, userId)));
}

export async function listActiveAgentIds(): Promise<string[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db.select({ agentId: jobs.agentId }).from(jobs).where(and(eq(jobs.userId, userId), eq(jobs.status, "running")));
  return rows.map((r) => r.agentId).filter((x): x is string => Boolean(x));
}
