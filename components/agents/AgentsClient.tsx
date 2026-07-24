"use client";
import { useState } from "react";
import { colors, fonts } from "@/lib/theme";
import AgentCard from "./AgentCard";
import TeamCard from "./TeamCard";
import NewAgentModal from "./NewAgentModal";
import NewTeamModal from "./NewTeamModal";
import type { AppAgent, AppTeam } from "@/lib/agents/types";

export default function AgentsClient({ agents, teams }: { agents: AppAgent[]; teams: AppTeam[] }) {
  const [showNewAgent, setShowNewAgent] = useState(false);
  const [showNewTeam, setShowNewTeam] = useState(false);

  const pillButton = {
    background: "transparent",
    border: "1px solid " + colors.steel,
    color: colors.bone,
    borderRadius: 999,
    padding: "9px 18px",
    fontSize: 13.5,
    cursor: "pointer",
  } as const;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 8 }}>
        <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
          Agents
        </h1>
        <button type="button" onClick={() => setShowNewAgent(true)} style={pillButton}>
          + New agent
        </button>
      </div>
      <p style={{ color: colors.mist, fontSize: 14.5, marginTop: 8, marginBottom: 28 }}>
        Your default Deal Team, plus anyone you&apos;ve added yourself.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} />
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 48, marginBottom: 8 }}>
        <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 22, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
          Teams
        </h2>
        <button type="button" onClick={() => setShowNewTeam(true)} style={pillButton}>
          + New team
        </button>
      </div>
      <p style={{ color: colors.mist, fontSize: 14.5, marginTop: 8, marginBottom: 28 }}>
        Group agents into a pod with a shared deal book.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {teams.map((t) => (
          <TeamCard key={t.id} team={t} agents={agents} />
        ))}
      </div>

      {showNewAgent && <NewAgentModal onClose={() => setShowNewAgent(false)} />}
      {showNewTeam && <NewTeamModal agents={agents} onClose={() => setShowNewTeam(false)} />}
    </div>
  );
}
