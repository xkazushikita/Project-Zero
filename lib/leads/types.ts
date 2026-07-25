export type LeadStatus = "new" | "pitched" | "negotiating" | "replied" | "booked";
export type LeadReview = "accepted" | "pending";
export type LeadSource = "manual" | "scrape";

export interface ResearchBrief {
  summary: string;
  priorities: string[];
  hooks: string[];
  angle: string;
}

export interface OutreachDraft {
  subject: string;
  body: string;
}

export interface ProposalDraft {
  subject: string;
  body: string;
  price: number | null;
}

export interface FollowUpDraft {
  subject: string;
  body: string;
}

export interface Lead {
  id: string;
  agentId: string | null;
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  status: LeadStatus;
  score: number | null;
  source: LeadSource;
  review: LeadReview;
  profileUrl: string | null;
  platform: string | null;
  research: ResearchBrief | null;
  outreach: OutreachDraft | null;
  proposal: ProposalDraft | null;
  followup: FollowUpDraft | null;
  createdAt: string;
}

export const STAGES: { id: LeadStatus; label: string }[] = [
  { id: "new", label: "New" },
  { id: "pitched", label: "Pitched" },
  { id: "negotiating", label: "Negotiating" },
  { id: "replied", label: "Replied" },
  { id: "booked", label: "Booked" },
];
