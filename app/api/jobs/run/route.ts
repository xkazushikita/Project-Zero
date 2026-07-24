export const runtime = "nodejs";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, inArray } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { getMyProfile } from "@/lib/profile/store";
import { profileSummary } from "@/lib/profile/summary";
import { listAgents } from "@/lib/agents/store";
import { getLead, saveLeadResearch } from "@/lib/leads/store";
import { logActivity } from "@/lib/activity/store";
import { draftResearch } from "@/lib/ai/research";

// Job kinds this runner knows how to execute. More are added as engines ship.
const HANDLED_KINDS = ["research"];

export async function POST() {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) {
    return NextResponse.json({ claimed: 0, remaining: 0, done: true });
  }

  const db = getDb()!;

  // Atomic claim: flips queued -> running; a job can only be claimed once.
  const claimed = await db
    .update(jobs)
    .set({ status: "running", startedAt: new Date() })
    .where(and(eq(jobs.userId, userId), eq(jobs.status, "queued"), inArray(jobs.kind, HANDLED_KINDS)))
    .returning();

  if (claimed.length === 0) {
    return NextResponse.json({ claimed: 0, remaining: 0, done: true });
  }

  const [profile, agents] = await Promise.all([getMyProfile(), listAgents()]);
  const creatorContext = profileSummary(profile);

  let cursor = 0;
  async function worker() {
    while (cursor < claimed.length) {
      const job = claimed[cursor++];
      try {
        if (job.kind === "research") {
          const params = job.params as { leadId?: string };
          const leadId = params.leadId;
          if (!leadId) throw new Error("Missing leadId");
          const lead = await getLead(leadId);
          if (!lead) throw new Error("Lead not found");
          const agent = agents.find((a) => a.id === job.agentId) ?? agents[0];
          const result = await draftResearch(agent, lead, creatorContext);
          await saveLeadResearch(leadId, result);
          await logActivity({
            agentId: agent?.id ?? null,
            leadId,
            type: "lead_qualified",
            text: (agent?.name ?? "Research") + " prepared a strategy for " + lead.name,
          });
        }
        await db.update(jobs).set({ status: "done", finishedAt: new Date() }).where(eq(jobs.id, job.id));
      } catch (err) {
        await db
          .update(jobs)
          .set({ status: "failed", finishedAt: new Date(), error: String(err) })
          .where(eq(jobs.id, job.id));
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(4, claimed.length) }, worker));

  const stillQueued = await db
    .select({ id: jobs.id })
    .from(jobs)
    .where(and(eq(jobs.userId, userId), eq(jobs.status, "queued"), inArray(jobs.kind, HANDLED_KINDS)));

  return NextResponse.json({ claimed: claimed.length, remaining: stillQueued.length, done: stillQueued.length === 0 });
}
