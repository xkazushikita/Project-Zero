import type { CapabilityId } from "@/lib/agentTypes";

export type AgentStatus = "working" | "waiting" | "offline" | "error";

export interface AppAgent {
  id: string;
  name: string;
  initials: string;
  role: string;
  color: string;
  status: AgentStatus;
  task: string;
  goal: string;
  avatarUrl: string | null;
  capabilities: CapabilityId[];
  type: string;
  isPreset: boolean;
  paused: boolean;
}

export interface AppTeam {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  description: string;
  goal: string;
  members: string[];
  isPreset: boolean;
}
