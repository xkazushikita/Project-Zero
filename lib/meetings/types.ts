export type MeetingKind = "call" | "shoot" | "deliverable";

export interface Meeting {
  id: string;
  leadId: string | null;
  agentId: string | null;
  title: string;
  kind: MeetingKind;
  whenAt: string;
  whenLabel: string | null;
  leadName: string | null;
}
