"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { leads, activity } from "@/lib/db/schema";
import type { Lead, LeadStatus, ResearchBrief, OutreachDraft, ProposalDraft, FollowUpDraft } from "./types";

function mapRow(r: typeof leads.$inferSelect): Lead {
  return {
    id: r.id,
    agentId: r.agentId,
    name: r.name,
    title: r.title,
    company: r.company,
    email: r.email,
    status: r.status as LeadStatus,
    score: r.score,
    source: r.source as Lead["source"],
    review: r.review as Lead["review"],
    profileUrl: r.profileUrl,
    platform: r.platform,
    research: (r.research as ResearchBrief) ?? null,
    outreach: (r.outreach as OutreachDraft) ?? null,
    proposal: (r.proposal as ProposalDraft) ?? null,
    followup: (r.followup as FollowUpDraft) ?? null,
    createdAt: r.createdAt.toISOString(),
  };
}

export async function getLead(id: string): Promise<Lead | null> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return null;
  const db = getDb()!;
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.id, id), eq(leads.userId, userId)))
    .limit(1);
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function saveLeadResearch(id: string, research: ResearchBrief) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ research, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals/" + id);
  revalidatePath("/deals");
}

export async function saveLeadOutreach(id: string, outreach: OutreachDraft) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ outreach, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals/" + id);
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function saveLeadProposal(id: string, proposal: ProposalDraft) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ proposal, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals/" + id);
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function saveLeadFollowup(id: string, followup: FollowUpDraft) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ followup, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals/" + id);
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

// For the public, logged-out welcome page — real pipeline numbers instead of
// the generic demo stats (this is a single-creator app, so there's only ever
// one real pipeline to show, same assumption as getPublicAgentShowcase).
export async function getPublicWorkspaceStats(): Promise<{ leadsWorked: number; tasksRunning: number; perAgent: { agentId: string; leadsWorked: number }[] }> {
  if (!isDbConfigured()) return { leadsWorked: 0, tasksRunning: 0, perAgent: [] };
  const db = getDb()!;
  const rows = await db.select().from(leads).where(eq(leads.review, "accepted"));
  const now = new Date();
  const leadsWorked = rows.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const tasksRunning = rows.filter((r) => r.status !== "booked").length;
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (r.agentId) counts.set(r.agentId, (counts.get(r.agentId) ?? 0) + 1);
  }
  return { leadsWorked, tasksRunning, perAgent: Array.from(counts, ([agentId, leadsWorked]) => ({ agentId, leadsWorked })) };
}

export async function listLeads(): Promise<Lead[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.review, "accepted")))
    .orderBy(desc(leads.createdAt));
  return rows.map(mapRow);
}

export async function listPendingLeads(): Promise<Lead[]> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return [];
  const db = getDb()!;
  const rows = await db
    .select()
    .from(leads)
    .where(and(eq(leads.userId, userId), eq(leads.review, "pending")))
    .orderBy(desc(leads.createdAt));
  return rows.map(mapRow);
}

export async function insertDiscoveredLeads(
  candidates: { name: string; company?: string; platform?: string; profileUrl?: string }[]
): Promise<number> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return 0;
  const db = getDb()!;
  let inserted = 0;
  for (const c of candidates) {
    if (!c.name?.trim()) continue;
    await db.insert(leads).values({
      userId,
      agentId: "discovery",
      name: c.name.trim(),
      company: c.company?.trim() || null,
      platform: c.platform?.trim() || null,
      profileUrl: c.profileUrl?.trim() || null,
      status: "new",
      source: "scrape",
      review: "pending",
    });
    inserted++;
  }
  revalidatePath("/deals");
  return inserted;
}

export async function addLead(input: {
  name: string;
  company?: string;
  email?: string;
  platform?: string;
  profileUrl?: string;
  agentId?: string;
}) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  const [row] = await db
    .insert(leads)
    .values({
      userId,
      name: input.name,
      company: input.company || null,
      email: input.email || null,
      platform: input.platform || null,
      profileUrl: input.profileUrl || null,
      agentId: input.agentId || null,
      status: "new",
      source: "manual",
      review: "accepted",
    })
    .returning({ id: leads.id });
  await db.insert(activity).values({
    userId,
    agentId: input.agentId || null,
    leadId: row.id,
    type: "lead_added",
    text: "Added " + input.name + (input.company ? " (" + input.company + ")" : ""),
  });
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function removeLead(id: string) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function updateLeadStatus(id: string, status: LeadStatus) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function assignLead(id: string, agentId: string | null) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ agentId, updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals");
}

export async function acceptLead(id: string) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .update(leads)
    .set({ review: "accepted", updatedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

export async function rejectLead(id: string) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.userId, userId)));
  revalidatePath("/deals");
}

const HEADER_ALIASES: Record<string, string[]> = {
  name: ["name", "full name", "brand name", "contact", "contact name"],
  company: ["company", "brand", "company name", "organization"],
  email: ["email", "e-mail", "contact email"],
  platform: ["platform", "social", "channel"],
  profileUrl: ["profile url", "profileurl", "website", "site", "url", "link", "profile"],
};

function matchHeader(header: string): keyof typeof HEADER_ALIASES | null {
  const h = header.trim().toLowerCase();
  for (const field of Object.keys(HEADER_ALIASES) as (keyof typeof HEADER_ALIASES)[]) {
    if (HEADER_ALIASES[field].includes(h)) return field;
  }
  return null;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      result.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export async function importLeadsCsv(csvText: string): Promise<{ imported: number }> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return { imported: 0 };

  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { imported: 0 };

  const headers = parseCsvLine(lines[0]).map(matchHeader);
  const db = getDb()!;
  let imported = 0;

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((field, idx) => {
      if (field) row[field] = (cells[idx] ?? "").trim();
    });
    if (!row.name && !row.company) continue;
    await db.insert(leads).values({
      userId,
      name: row.name || row.company || "Unnamed brand",
      company: row.company || null,
      email: row.email || null,
      platform: row.platform || null,
      profileUrl: row.profileUrl || null,
      status: "new",
      source: "manual",
      review: "accepted",
    });
    imported++;
  }

  if (imported > 0) {
    await db.insert(activity).values({
      userId,
      type: "lead_added",
      text: "Imported " + imported + " brand" + (imported === 1 ? "" : "s") + " from a CSV",
    });
  }

  revalidatePath("/deals");
  revalidatePath("/dashboard");
  return { imported };
}
