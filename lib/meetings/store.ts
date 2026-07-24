"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { meetings as meetingsTable, leads } from "@/lib/db/schema";
import { parseMeetingTime } from "@/lib/ai/meetingTime";
import { logActivity } from "@/lib/activity/store";
import { trackJobStart, trackJobFinish } from "@/lib/jobs/store";
import type { Meeting, MeetingKind } from "./types";

const CONFLICT_WINDOW_MS = 45 * 60 * 1000;

export async function listMeetings(): Promise<Meeting[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db
    .select({
      id: meetingsTable.id,
      leadId: meetingsTable.leadId,
      agentId: meetingsTable.agentId,
      title: meetingsTable.title,
      kind: meetingsTable.kind,
      whenAt: meetingsTable.whenAt,
      whenLabel: meetingsTable.whenLabel,
      leadName: leads.name,
    })
    .from(meetingsTable)
    .leftJoin(leads, eq(meetingsTable.leadId, leads.id))
    .where(eq(meetingsTable.userId, userId))
    .orderBy(asc(meetingsTable.whenAt));

  return rows.map((r) => ({
    id: r.id,
    leadId: r.leadId,
    agentId: r.agentId,
    title: r.title,
    kind: r.kind as MeetingKind,
    whenAt: r.whenAt.toISOString(),
    whenLabel: r.whenLabel,
    leadName: r.leadName ?? null,
  }));
}

// Anything already on the calendar within ~45 minutes of this time — so a
// booking agent can warn about a clash instead of silently double-booking.
async function findConflict(userId: string, whenAt: Date): Promise<{ title: string; whenLabel: string | null } | null> {
  const db = getDb()!;
  const rows = await db.select({ title: meetingsTable.title, whenAt: meetingsTable.whenAt, whenLabel: meetingsTable.whenLabel }).from(meetingsTable).where(eq(meetingsTable.userId, userId));
  const conflict = rows.find((r) => Math.abs(r.whenAt.getTime() - whenAt.getTime()) < CONFLICT_WINDOW_MS);
  return conflict ? { title: conflict.title, whenLabel: conflict.whenLabel } : null;
}

export async function bookMeetingFromText(
  text: string,
  leadId?: string
): Promise<{ ok: boolean; error?: string; meeting?: { title: string; whenLabel: string }; conflict?: { title: string; whenLabel: string | null } }> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return { ok: false, error: "Not available right now." };
  const db = getDb()!;

  let brandName: string | undefined;
  let agentId: string | null = null;
  if (leadId) {
    const rows = await db.select({ name: leads.name, agentId: leads.agentId }).from(leads).where(and(eq(leads.id, leadId), eq(leads.userId, userId))).limit(1);
    brandName = rows[0]?.name;
    agentId = rows[0]?.agentId ?? null;
  }

  const jobId = await trackJobStart("book-meeting", agentId ?? "scheduler");
  const parsed = await parseMeetingTime(text, brandName);
  if (!parsed.ok) {
    await trackJobFinish(jobId, "failed");
    if (parsed.reason === "rate-limited") {
      return { ok: false, error: "My AI brain is a little overloaded right now (hit a rate limit) — give it a minute and try again, or enter it manually." };
    }
    if (parsed.reason === "not-configured") {
      return { ok: false, error: "Enter it manually below for now." };
    }
    return { ok: false, error: "Couldn't figure out a date and time from that — try being more specific, or enter it manually." };
  }
  await trackJobFinish(jobId, "done");

  const conflict = await findConflict(userId, parsed.whenAt);

  await db.insert(meetingsTable).values({
    userId,
    agentId: agentId ?? "scheduler",
    leadId: leadId ?? null,
    title: parsed.title,
    kind: "call",
    whenAt: parsed.whenAt,
    whenLabel: parsed.whenLabel,
  });

  if (leadId) {
    await db.update(leads).set({ status: "booked", updatedAt: new Date() }).where(and(eq(leads.id, leadId), eq(leads.userId, userId)));
  }

  await logActivity({
    agentId: agentId ?? "scheduler",
    leadId: leadId ?? null,
    type: "meeting_booked",
    text: "Booked " + parsed.title + " — " + parsed.whenLabel,
  });

  revalidatePath("/calendar");
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath("/deals/" + leadId);

  return { ok: true, meeting: { title: parsed.title, whenLabel: parsed.whenLabel }, conflict: conflict ?? undefined };
}

export async function bookMeetingManual(
  input: { title: string; whenAt: string; leadId?: string }
): Promise<{ ok: boolean; error?: string; conflict?: { title: string; whenLabel: string | null } }> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return { ok: false, error: "Not available right now." };
  const when = new Date(input.whenAt);
  if (isNaN(when.getTime())) return { ok: false, error: "That date/time didn't parse — please pick it again." };

  const db = getDb()!;
  let agentId: string | null = null;
  if (input.leadId) {
    const rows = await db.select({ agentId: leads.agentId }).from(leads).where(and(eq(leads.id, input.leadId), eq(leads.userId, userId))).limit(1);
    agentId = rows[0]?.agentId ?? null;
  }

  const conflict = await findConflict(userId, when);
  const whenLabel = when.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  await db.insert(meetingsTable).values({
    userId,
    agentId: agentId ?? "scheduler",
    leadId: input.leadId ?? null,
    title: input.title,
    kind: "call",
    whenAt: when,
    whenLabel,
  });

  if (input.leadId) {
    await db.update(leads).set({ status: "booked", updatedAt: new Date() }).where(and(eq(leads.id, input.leadId), eq(leads.userId, userId)));
  }

  await logActivity({
    agentId: agentId ?? "scheduler",
    leadId: input.leadId ?? null,
    type: "meeting_booked",
    text: "Booked " + input.title + " — " + whenLabel,
  });

  revalidatePath("/calendar");
  revalidatePath("/deals");
  revalidatePath("/dashboard");
  if (input.leadId) revalidatePath("/deals/" + input.leadId);

  return { ok: true, conflict: conflict ?? undefined };
}
