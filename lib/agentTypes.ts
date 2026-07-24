export type CapabilityId =
  | "scrape"
  | "research"
  | "outreach"
  | "proposal"
  | "follow-up"
  | "book-meeting";

export interface Capability {
  id: CapabilityId;
  label: string;
  jobKind: string;
}

export const CAPABILITIES: Capability[] = [
  { id: "scrape", label: "Research", jobKind: "scrape" },
  { id: "research", label: "Brand brief", jobKind: "research" },
  { id: "outreach", label: "Initial outreach", jobKind: "outreach" },
  { id: "proposal", label: "Proposals", jobKind: "proposal" },
  { id: "follow-up", label: "Follow-ups", jobKind: "follow-up" },
  { id: "book-meeting", label: "Scheduling", jobKind: "book-meeting" },
];

export type AgentStatus = "working" | "waiting" | "offline" | "error";

export interface AgentType {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  capabilities: CapabilityId[];
  status: AgentStatus;
  task: string;
  goal: string;
}

// The premade "Deal Team" — every new creator gets these five.
export const AGENT_TYPES: AgentType[] = [
  {
    id: "discovery",
    name: "Kaneki",
    initials: "KN",
    role: "Research",
    color: "#0EA5E9",
    capabilities: ["scrape"],
    status: "working",
    task: "Scanning the web for brands in your niche",
    goal: "Discover relevant partnership opportunities",
  },
  {
    id: "outreach",
    name: "Goku",
    initials: "GK",
    role: "Initial Outreach",
    color: "#5122C1",
    capabilities: ["outreach"],
    status: "working",
    task: "Drafting a pitch for Bloom Nutrition",
    goal: "Craft personalized first-contact emails and DMs",
  },
  {
    id: "proposal",
    name: "Anaya",
    initials: "AN",
    role: "Proposal",
    color: "#7C3AED",
    capabilities: ["proposal"],
    status: "working",
    task: "Pricing a proposal for Glow Skincare",
    goal: "Create professional sponsorship proposals and media kits",
  },
  {
    id: "followup",
    name: "Lexie",
    initials: "LX",
    role: "Follow-up",
    color: "#8B5CF6",
    capabilities: ["follow-up"],
    status: "waiting",
    task: "Watching for brands that went quiet",
    goal: "Manage outreach sequences and keep conversations moving",
  },
  {
    id: "scheduler",
    name: "Itachi",
    initials: "IT",
    role: "Scheduler",
    color: "#F43F7E",
    capabilities: ["book-meeting"],
    status: "waiting",
    task: "Ready to book your next call",
    goal: "Schedule calls and handle booking logistics",
  },
];

export interface TeamTemplate {
  id: string;
  name: string;
  members: string[];
}

export const TEAM_TEMPLATES: TeamTemplate[] = [
  { id: "deal-team", name: "Deal Team", members: AGENT_TYPES.map((a) => a.id) },
];
