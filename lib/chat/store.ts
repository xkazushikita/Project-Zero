"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { messages as messagesTable } from "@/lib/db/schema";
import { listAgents } from "@/lib/agents/store";
import { listLeads, getLead, saveLeadResearch } from "@/lib/leads/store";
import { getMyProfile } from "@/lib/profile/store";
import { profileSummary } from "@/lib/profile/summary";
import { draftResearch } from "@/lib/ai/research";
import { runDiscovery } from "@/lib/discovery/run";
import { bookMeetingFromText, listMeetings } from "@/lib/meetings/store";
import { classifyChatIntent } from "@/lib/ai/chatRouter";
import { trackJobStart, trackJobFinish } from "@/lib/jobs/store";
import { CAPABILITIES } from "@/lib/agentTypes";
import { STAGES } from "@/lib/leads/types";
import type { AppAgent } from "@/lib/agents/types";
import type { ChatMessage } from "./types";

function mapRow(r: typeof messagesTable.$inferSelect): ChatMessage {
  return { id: r.id, agentId: r.agentId, who: r.who as "ai" | "me", text: r.text, createdAt: r.createdAt.toISOString() };
}

export async function listMessages(): Promise<ChatMessage[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db.select().from(messagesTable).where(eq(messagesTable.userId, userId)).orderBy(asc(messagesTable.id));
  return rows.map(mapRow);
}

function findMentionedAgent(text: string, agents: AppAgent[]): AppAgent | null {
  const lower = text.toLowerCase();
  return agents.find((a) => lower.includes("@" + a.name.toLowerCase())) ?? null;
}

export async function sendMessage(text: string): Promise<ChatMessage[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;

  const [userRow] = await db.insert(messagesTable).values({ userId, agentId: null, who: "me", text }).returning();

  const [agents, leadList] = await Promise.all([listAgents(), listLeads()]);
  const mentioned = findMentionedAgent(text, agents);
  const intent = await classifyChatIntent(text, leadList.map((l) => l.name));

  let actingAgent = mentioned;
  const capability = intent.capability;
  if (capability !== "chat") {
    if (!actingAgent || !actingAgent.capabilities.includes(capability)) {
      actingAgent = agents.find((a) => a.capabilities.includes(capability)) ?? actingAgent;
    }
  }
  if (!actingAgent) actingAgent = agents[0];

  let reply: string;

  try {
    if (intent.capability === "scrape") {
      const { found } = await runDiscovery();
      reply =
        found > 0
          ? "Went looking and found " + found + " new brand" + (found === 1 ? "" : "s") + " — they're waiting in Pending review on Brand Deals for you to approve."
          : "I searched but didn't turn up anything solid this time — try again shortly, or add a brand yourself on Brand Deals.";
    } else if (intent.capability === "research") {
      const match = intent.leadName ? leadList.find((l) => l.name.toLowerCase() === intent.leadName!.toLowerCase()) : null;
      if (!match) {
        reply = "I'd love to prep a strategy — which brand? Mention its name and I'll get to work (it needs to already be in your pipeline).";
      } else {
        const lead = await getLead(match.id);
        const profile = await getMyProfile();
        const context = profileSummary(profile);
        if (!lead) {
          reply = "Couldn't find that brand — try again?";
        } else {
          const jobId = await trackJobStart("research", actingAgent.id);
          const result = await draftResearch(actingAgent, lead, context);
          await saveLeadResearch(lead.id, result);
          await trackJobFinish(jobId, "done");
          reply = "Done — strategy ready for " + lead.name + ": " + result.angle + " Full brief is on that brand's page.";
        }
      }
    } else if (intent.capability === "book-meeting" && intent.isCalendarQuery) {
      const upcoming = (await listMeetings()).filter((m) => new Date(m.whenAt) >= new Date()).slice(0, 5);
      reply =
        upcoming.length === 0
          ? "Nothing on your calendar right now."
          : "Here's what's coming up: " + upcoming.map((m) => m.title + (m.whenLabel ? " — " + m.whenLabel : "")).join("; ") + ".";
    } else if (intent.capability === "book-meeting") {
      const match = intent.leadName ? leadList.find((l) => l.name.toLowerCase() === intent.leadName!.toLowerCase()) : null;
      const res = await bookMeetingFromText(text, match?.id);
      reply = res.ok
        ? "Booked: " +
          res.meeting?.title +
          " — " +
          res.meeting?.whenLabel +
          "." +
          (res.conflict ? " ⚠️ Heads up — you also have \"" + res.conflict.title + "\" around " + res.conflict.whenLabel + "." : "") +
          " It's on your Calendar."
        : res.error ?? "Couldn't quite parse a date and time from that — try being specific, or book it manually from the Calendar page.";
    } else if (intent.isPipelineQuery) {
      if (intent.stage) {
        const stageLabel = STAGES.find((s) => s.id === intent.stage)?.label ?? intent.stage;
        const matches = leadList.filter((l) => l.status === intent.stage);
        reply =
          matches.length === 0
            ? "Nothing in " + stageLabel + " right now."
            : matches.length + " brand" + (matches.length === 1 ? "" : "s") + " in " + stageLabel + ": " + matches.map((l) => l.name).join(", ") + ".";
      } else {
        const counts = STAGES.map((s) => leadList.filter((l) => l.status === s.id).length + " " + s.label);
        reply = "Here's your pipeline: " + counts.join(", ") + ".";
      }
    } else if (intent.capability === "outreach" || intent.capability === "proposal" || intent.capability === "follow-up") {
      const label = CAPABILITIES.find((c) => c.id === intent.capability)?.label ?? intent.capability;
      reply = "I can't do that one quite yet — " + label + " is still being built. For now I can find brands, prep a pitch strategy, or book a call.";
    } else {
      reply =
        "Got it — for now you can ask me to find brands, prep a strategy for one, or book a call. Try \"@" +
        actingAgent.name +
        " find me brands\" or \"@" +
        actingAgent.name +
        ' book a call with [brand] next Tuesday at 2pm".';
    }
  } catch {
    reply = "Hit a snag trying that — mind trying again in a moment?";
  }

  const [aiRow] = await db.insert(messagesTable).values({ userId, agentId: actingAgent.id, who: "ai", text: reply }).returning();

  revalidatePath("/chat");
  return [mapRow(userRow), mapRow(aiRow)];
}
