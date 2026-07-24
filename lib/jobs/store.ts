"use server";
import { auth } from "@clerk/nextjs/server";
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
