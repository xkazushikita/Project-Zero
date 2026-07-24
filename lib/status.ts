import type { AgentStatus } from "./agentTypes";
import { colors } from "./theme";

export interface StatusMeta {
  label: string;
  bg: string;
  color: string;
  dot: string;
}

const STATUS_META: Record<AgentStatus, StatusMeta> = {
  working: { label: "Working", bg: "rgba(143,177,151,.12)", color: colors.sage, dot: colors.sage },
  waiting: { label: "Waiting", bg: "rgba(204,145,102,.12)", color: colors.copper, dot: colors.copper },
  offline: { label: "Offline", bg: "rgba(119,122,136,.12)", color: colors.steel, dot: colors.steel },
  error: { label: "Error", bg: "rgba(201,116,111,.12)", color: colors.errorRed, dot: colors.errorRed },
};

export function statusMeta(s: AgentStatus): StatusMeta {
  return STATUS_META[s] ?? STATUS_META.offline;
}
