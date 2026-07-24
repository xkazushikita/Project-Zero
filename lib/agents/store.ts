"use server";
import { auth } from "@clerk/nextjs/server";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { agents as agentsTable, agentConfig, agentStates, teams as teamsTable, teamMembers } from "@/lib/db/schema";
import { AGENT_TYPES, TEAM_TEMPLATES, type CapabilityId } from "@/lib/agentTypes";
import type { AppAgent, AppTeam, AgentStatus } from "./types";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "A").toUpperCase() + (parts[1]?.[0] ?? "").toUpperCase();
}

export async function listAgents(): Promise<AppAgent[]> {
  const { userId } = await auth();

  if (!userId || !isDbConfigured()) {
    return AGENT_TYPES.map((a) => ({
      id: a.id,
      name: a.name,
      initials: a.initials,
      role: a.role,
      color: a.color,
      status: a.status,
      task: a.task,
      goal: a.goal,
      avatarUrl: null,
      capabilities: a.capabilities,
      type: a.id,
      isPreset: true,
      paused: false,
    }));
  }

  const db = getDb()!;
  const [customRows, configRows, stateRows] = await Promise.all([
    db.select().from(agentsTable).where(eq(agentsTable.userId, userId)),
    db.select().from(agentConfig).where(eq(agentConfig.userId, userId)),
    db.select().from(agentStates).where(eq(agentStates.userId, userId)),
  ]);
  const configMap = new Map(configRows.map((r) => [r.agentId, r]));
  const stateMap = new Map(stateRows.map((r) => [r.agentId, r]));

  const presetAgents: AppAgent[] = AGENT_TYPES.filter((a) => !stateMap.get(a.id)?.removed).map((a) => {
    const cfg = configMap.get(a.id);
    const st = stateMap.get(a.id);
    return {
      id: a.id,
      name: a.name,
      initials: a.initials,
      role: cfg?.role || a.role,
      color: a.color,
      status: st?.paused ? "offline" : a.status,
      task: a.task,
      goal: cfg?.goal || a.goal,
      avatarUrl: cfg?.avatarUrl ?? null,
      capabilities: a.capabilities,
      type: a.id,
      isPreset: true,
      paused: Boolean(st?.paused),
    };
  });

  const customAgents: AppAgent[] = customRows
    .filter((r) => !stateMap.get(r.id)?.removed)
    .map((r) => {
      const st = stateMap.get(r.id);
      return {
        id: r.id,
        name: r.name,
        initials: r.initials,
        role: r.role,
        color: r.color,
        status: (st?.paused ? "offline" : r.status) as AgentStatus,
        task: r.task ?? "",
        goal: r.goal ?? "",
        avatarUrl: r.avatarUrl ?? null,
        capabilities: (r.capabilities as CapabilityId[]) ?? [],
        type: "custom",
        isPreset: false,
        paused: Boolean(st?.paused),
      };
    });

  return [...presetAgents, ...customAgents];
}

// For the public, logged-out welcome page — no signed-in user to scope to, so
// this shows the preset team with whatever avatar photos have been set (this is
// a single-creator app, so there's only ever one real set of photos to show).
export async function getPublicAgentShowcase(): Promise<{ id: string; name: string; initials: string; color: string; status: AgentStatus; capabilities: CapabilityId[]; avatarUrl: string | null }[]> {
  if (!isDbConfigured()) {
    return AGENT_TYPES.map((a) => ({ id: a.id, name: a.name, initials: a.initials, color: a.color, status: a.status, capabilities: a.capabilities, avatarUrl: null }));
  }
  const db = getDb()!;
  const configRows = await db.select().from(agentConfig);
  const configMap = new Map(configRows.filter((r) => r.avatarUrl).map((r) => [r.agentId, r.avatarUrl]));
  return AGENT_TYPES.map((a) => ({
    id: a.id,
    name: a.name,
    initials: a.initials,
    color: a.color,
    status: a.status,
    capabilities: a.capabilities,
    avatarUrl: configMap.get(a.id) ?? null,
  }));
}

export async function getAgent(id: string): Promise<AppAgent | null> {
  const all = await listAgents();
  return all.find((a) => a.id === id) ?? null;
}

export async function listTeams(): Promise<AppTeam[]> {
  const { userId } = await auth();
  const presetTeams: AppTeam[] = TEAM_TEMPLATES.map((t) => ({
    id: t.id,
    name: t.name,
    icon: "✦",
    iconBg: "#2C1B5E",
    description: "Your default deal team — covers a brand deal end to end.",
    goal: "Find, pitch, propose, follow up, and book brand deals.",
    members: t.members,
    isPreset: true,
  }));

  if (!userId || !isDbConfigured()) return presetTeams;

  const db = getDb()!;
  const [customRows, memberRows] = await Promise.all([
    db.select().from(teamsTable).where(eq(teamsTable.userId, userId)),
    db.select().from(teamMembers).where(eq(teamMembers.userId, userId)),
  ]);
  const memberMap = new Map(memberRows.map((r) => [r.teamId, r.members as string[]]));

  const mergedPresets = presetTeams.map((t) => ({ ...t, members: memberMap.get(t.id) ?? t.members }));
  const customTeams: AppTeam[] = customRows.map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon ?? "✦",
    iconBg: r.iconBg ?? "#2C1B5E",
    description: r.description ?? "",
    goal: r.goal ?? "",
    members: (r.members as string[]) ?? [],
    isPreset: false,
  }));

  return [...mergedPresets, ...customTeams];
}

const PALETTE = ["#0EA5E9", "#5122C1", "#7C3AED", "#8B5CF6", "#F43F7E", "#2FA45C", "#F59E0B", "#CC9166"];

export async function createAgent(input: { name: string; role: string; goal: string; capabilities: CapabilityId[] }) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  const id = "agent_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
  await db.insert(agentsTable).values({
    userId,
    id,
    name: input.name,
    initials: initialsFrom(input.name),
    role: input.role,
    color,
    status: "waiting",
    task: "Ready to get to work",
    goal: input.goal,
    type: "custom",
    capabilities: input.capabilities,
  });
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function updateAgentProfile(agentId: string, input: { role: string; goal: string }) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  const isPreset = AGENT_TYPES.some((a) => a.id === agentId);
  if (isPreset) {
    await db
      .insert(agentConfig)
      .values({ userId, agentId, role: input.role, goal: input.goal })
      .onConflictDoUpdate({ target: [agentConfig.userId, agentConfig.agentId], set: { role: input.role, goal: input.goal } });
  } else {
    await db.update(agentsTable).set({ role: input.role, goal: input.goal }).where(and(eq(agentsTable.userId, userId), eq(agentsTable.id, agentId)));
  }
  revalidatePath("/agents");
  revalidatePath("/agents/" + agentId);
  revalidatePath("/dashboard");
}

export async function setAgentAvatar(agentId: string, avatarUrl: string | null) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  if (avatarUrl && (!avatarUrl.startsWith("data:image/") || avatarUrl.length > 400_000)) return;
  const db = getDb()!;
  const isPreset = AGENT_TYPES.some((a) => a.id === agentId);
  if (isPreset) {
    await db
      .insert(agentConfig)
      .values({ userId, agentId, avatarUrl })
      .onConflictDoUpdate({ target: [agentConfig.userId, agentConfig.agentId], set: { avatarUrl } });
  } else {
    await db.update(agentsTable).set({ avatarUrl }).where(and(eq(agentsTable.userId, userId), eq(agentsTable.id, agentId)));
  }
  revalidatePath("/agents");
  revalidatePath("/agents/" + agentId);
  revalidatePath("/dashboard");
  revalidatePath("/chat");
}

export async function pauseAgent(agentId: string, paused: boolean) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .insert(agentStates)
    .values({ userId, agentId, paused, removed: false })
    .onConflictDoUpdate({ target: [agentStates.userId, agentStates.agentId], set: { paused } });
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function removeAgent(agentId: string) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  await db
    .insert(agentStates)
    .values({ userId, agentId, removed: true, paused: false })
    .onConflictDoUpdate({ target: [agentStates.userId, agentStates.agentId], set: { removed: true } });
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}

export async function createTeam(input: { name: string; description: string; goal: string; members: string[] }) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  const id = "team_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  await db.insert(teamsTable).values({
    userId,
    id,
    name: input.name,
    icon: "✦",
    iconBg: "#2C1B5E",
    description: input.description,
    goal: input.goal,
    members: input.members,
    template: "custom",
  });
  revalidatePath("/agents");
  revalidatePath("/dashboard");
}
