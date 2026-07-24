import { listMessages } from "@/lib/chat/store";
import { listAgents } from "@/lib/agents/store";
import ChatClient from "@/components/chat/ChatClient";
import { colors, fonts } from "@/lib/theme";

export default async function ChatPage() {
  const [messages, agents] = await Promise.all([listMessages(), listAgents()]);

  return (
    <div>
      <h1 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 28, letterSpacing: "0.01em", color: colors.paperWhite, margin: 0 }}>
        Chat
      </h1>
      <p style={{ color: colors.mist, fontSize: 14.5, marginTop: 8, marginBottom: 20 }}>
        @mention any teammate and they&apos;ll actually do the work — find brands, prep a strategy, or book a call.
      </p>
      <ChatClient initialMessages={messages} agents={agents} />
    </div>
  );
}
