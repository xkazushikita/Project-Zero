"use client";
import { useEffect, useRef, useState } from "react";
import { colors } from "@/lib/theme";
import { sendMessage } from "@/lib/chat/store";
import type { ChatMessage } from "@/lib/chat/types";
import type { AppAgent } from "@/lib/agents/types";
import AgentAvatar from "@/components/agents/AgentAvatar";

export default function ChatClient({ initialMessages, agents }: { initialMessages: ChatMessage[]; agents: AppAgent[] }) {
  const [messages, setMessages] = useState(initialMessages);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const byId = (id: string | null) => agents.find((a) => a.id === id) ?? null;

  const atIndex = text.lastIndexOf("@");
  const showMentions = atIndex !== -1 && !text.slice(atIndex + 1).includes(" ");
  const mentionQuery = showMentions ? text.slice(atIndex + 1).toLowerCase() : "";
  const mentionMatches = showMentions ? agents.filter((a) => a.name.toLowerCase().includes(mentionQuery)) : [];

  function insertMention(name: string) {
    setText(text.slice(0, atIndex) + "@" + name + " ");
  }

  async function submit() {
    const value = text.trim();
    if (!value || sending) return;
    const optimisticId = -Date.now();
    setMessages((m) => [...m, { id: optimisticId, agentId: null, who: "me", text: value, createdAt: new Date().toISOString() }]);
    setText("");
    setSending(true);
    const result = await sendMessage(value);
    setSending(false);
    if (result.length) {
      setMessages((m) => [...m.filter((x) => x.id !== optimisticId), ...result]);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100dvh - 200px)", minHeight: 420 }}>
      <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 12 }}>
        {messages.length === 0 && (
          <div style={{ color: colors.fog, fontSize: 13.5 }}>
            Try: &quot;@{agents[0]?.name ?? "Kaus"} find me brands&quot;
          </div>
        )}
        {messages.map((m) => {
          const agent = m.who === "ai" ? byId(m.agentId) : null;
          return (
            <div key={m.id} style={{ display: "flex", gap: 10, alignItems: "flex-start", flexDirection: m.who === "me" ? "row-reverse" : "row" }}>
              {agent && <AgentAvatar avatarUrl={agent.avatarUrl} color={agent.color} initials={agent.initials} size={28} />}
              <div style={{ maxWidth: "72%" }}>
                {agent && <div style={{ fontSize: 11.5, color: colors.fog, marginBottom: 3 }}>{agent.name}</div>}
                <div
                  style={{
                    background: m.who === "me" ? colors.paperWhite : colors.onyx,
                    color: m.who === "me" ? "#000" : colors.bone,
                    border: m.who === "me" ? "none" : "1px solid " + colors.graphite,
                    borderRadius: 14,
                    padding: "10px 14px",
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  {m.text}
                </div>
              </div>
            </div>
          );
        })}
        {sending && <div style={{ fontSize: 12.5, color: colors.fog, fontStyle: "italic" }}>Working on it…</div>}
      </div>

      <div style={{ position: "relative", borderTop: "1px solid " + colors.graphite, paddingTop: 14 }}>
        {mentionMatches.length > 0 && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: 0,
              marginBottom: 8,
              background: colors.onyx,
              border: "1px solid " + colors.graphite,
              borderRadius: 10,
              overflow: "hidden",
              minWidth: 200,
              zIndex: 5,
            }}
          >
            {mentionMatches.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => insertMention(a.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 12px",
                  background: "transparent",
                  border: "none",
                  color: colors.bone,
                  fontSize: 13,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <AgentAvatar avatarUrl={a.avatarUrl} color={a.color} initials={a.initials} size={18} />
                {a.name}
              </button>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
            }}
            placeholder="@mention a helper and tell them what you need…"
            style={{
              flex: 1,
              padding: "12px 16px",
              borderRadius: 999,
              background: "transparent",
              border: "1px solid " + colors.graphite,
              color: colors.bone,
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || !text.trim()}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              opacity: sending || !text.trim() ? 0.6 : 1,
            }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
