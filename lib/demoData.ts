// Representative demo numbers so the dashboard looks alive before there's
// any real account/database/AI wired up (Milestone 1 shows the preset team).

export interface WorkspaceStats {
  activeAgents: number;
  tasksRunning: number;
  leadsWorked: number;
  perAgent: { agentId: string; leadsWorked: number }[];
}

export interface ActivityItem {
  agentId: string;
  text: string;
}

export const demoStats: WorkspaceStats = {
  activeAgents: 3,
  tasksRunning: 5,
  leadsWorked: 24,
  perAgent: [
    { agentId: "discovery", leadsWorked: 9 },
    { agentId: "outreach", leadsWorked: 7 },
    { agentId: "proposal", leadsWorked: 4 },
    { agentId: "followup", leadsWorked: 3 },
    { agentId: "scheduler", leadsWorked: 1 },
  ],
};

export const demoActivity: ActivityItem[] = [
  { agentId: "scheduler", text: "booked a call with Glossier" },
  { agentId: "outreach", text: "drafted a pitch for Bloom Nutrition" },
  { agentId: "discovery", text: "found 4 new brands in your niche" },
  { agentId: "proposal", text: "sent a proposal to Glow Skincare" },
];
