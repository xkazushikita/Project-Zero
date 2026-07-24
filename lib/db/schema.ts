import { pgTable, text, jsonb, timestamp, integer, boolean, primaryKey, uuid, index, serial } from "drizzle-orm/pg-core";

// The account. Auth (passwords, Google sign-in, reset) lives in Clerk —
// id is the Clerk user id, not a generated UUID, and there is no passwordHash.
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email"),
  name: text("name"),
  workspaceName: text("workspace_name").notNull().default("My Workspace"),
  notifications: jsonb("notifications").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The Media Kit — one row per user. Read by every AI engine as creatorContext.
export const creatorProfile = pgTable("creator_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  niche: text("niche"),
  bio: text("bio"),
  platforms: jsonb("platforms").notNull().default([]),
  audience: jsonb("audience").notNull().default({}),
  tone: text("tone"),
  pastDeals: text("past_deals"),
  rateFloor: integer("rate_floor"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// TikTok connection — one row per user, filled in once they connect via OAuth.
export const tiktokConnections = pgTable("tiktok_connections", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  openId: text("open_id").notNull(),
  username: text("username"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  followerCount: integer("follower_count"),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  syncedAt: timestamp("synced_at", { withTimezone: true }).notNull().defaultNow(),
});

// Agents the user created themselves. The five presets are static data in code
// (lib/agentTypes.ts) — only custom additions and overrides live here.
export const agents = pgTable(
  "agents",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    initials: text("initials").notNull(),
    role: text("role").notNull(),
    color: text("color").notNull(),
    status: text("status").notNull().default("waiting"),
    task: text("task"),
    score: integer("score"),
    goal: text("goal"),
    char: integer("char"),
    avatarUrl: text("avatar_url"),
    type: text("type").notNull().default("custom"),
    capabilities: jsonb("capabilities").notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.id] }) })
);

// Pods the user created. The one "Deal Team" template is static data in code.
export const teams = pgTable(
  "teams",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    id: text("id").notNull(),
    name: text("name").notNull(),
    icon: text("icon"),
    iconBg: text("icon_bg"),
    description: text("description"),
    goal: text("goal"),
    members: jsonb("members").notNull().default([]),
    activity: jsonb("activity").notNull().default([]),
    meetings: integer("meetings").notNull().default(0),
    pipeline: integer("pipeline").notNull().default(0),
    leads: integer("leads").notNull().default(0),
    template: text("template"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.id] }) })
);

// Per-user overrides layered on top of preset agents/teams, so a creator can
// tweak a preset without duplicating it.
export const agentConfig = pgTable(
  "agent_config",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    role: text("role"),
    goal: text("goal"),
    avatarUrl: text("avatar_url"),
    permissions: jsonb("permissions"),
    settings: jsonb("settings"),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.agentId] }) })
);

export const agentStates = pgTable(
  "agent_states",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id").notNull(),
    removed: boolean("removed").notNull().default(false),
    paused: boolean("paused").notNull().default(false),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.agentId] }) })
);

export const teamMembers = pgTable(
  "team_members",
  {
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    teamId: text("team_id").notNull(),
    members: jsonb("members").notNull().default([]),
  },
  (table) => ({ pk: primaryKey({ columns: [table.userId, table.teamId] }) })
);

// Brands / deals — the pipeline. Discovered brands land here as review: "pending"
// and must be accepted before agents work them; manual adds are accepted right away.
export const leads = pgTable(
  "leads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id"),
    name: text("name").notNull(),
    title: text("title"),
    company: text("company"),
    email: text("email"),
    status: text("status").notNull().default("new"),
    score: integer("score"),
    source: text("source").notNull().default("manual"),
    review: text("review").notNull().default("accepted"),
    profileUrl: text("profile_url"),
    platform: text("platform"),
    research: jsonb("research"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userAgentIdx: index("leads_user_agent_idx").on(table.userId, table.agentId),
    userReviewIdx: index("leads_user_review_idx").on(table.userId, table.review),
  })
);

// The event log — feeds notifications, the dashboard, and analytics.
export const activity = pgTable("activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  type: text("type").notNull(),
  leadId: uuid("lead_id"),
  text: text("text").notNull(),
  dismissed: boolean("dismissed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// The work queue. A runner claims a "queued" job atomically, runs the engine, marks it done/failed.
export const jobs = pgTable("jobs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  agentId: text("agent_id"),
  kind: text("kind").notNull(),
  status: text("status").notNull().default("queued"),
  params: jsonb("params").notNull().default({}),
  result: jsonb("result"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
});

// Booked brand calls — the calendar's only source.
export const meetings = pgTable(
  "meetings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id"),
    leadId: uuid("lead_id"),
    title: text("title").notNull(),
    kind: text("kind").notNull().default("call"),
    whenAt: timestamp("when_at", { withTimezone: true }).notNull(),
    whenLabel: text("when_label"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userWhenIdx: index("meetings_user_when_idx").on(table.userId, table.whenAt),
  })
);

// The team group chat — one shared, ordered thread per user. agentId marks which
// agent authored an "ai" message (null for the creator's own "me" messages).
export const messages = pgTable(
  "messages",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    agentId: text("agent_id"),
    who: text("who").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("messages_user_idx").on(table.userId, table.id),
  })
);
