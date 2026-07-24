import { listLeads, listPendingLeads } from "@/lib/leads/store";
import { listAgents } from "@/lib/agents/store";
import DealsClient from "@/components/deals/DealsClient";

export default async function DealsPage() {
  const [leads, pending, agents] = await Promise.all([listLeads(), listPendingLeads(), listAgents()]);
  return <DealsClient leads={leads} pending={pending} agents={agents} />;
}
