import { colors } from "@/lib/theme";
import DraftButton from "./DraftButton";

export default function DraftPanel({
  kind,
  title,
  emptyHint,
  buttonLabel,
  redraftLabel,
  leadId,
  agentId,
  draft,
  price,
}: {
  kind: "outreach" | "proposal" | "follow-up";
  title: string;
  emptyHint: string;
  buttonLabel: string;
  redraftLabel: string;
  leadId: string;
  agentId: string | null;
  draft: { subject: string; body: string } | null;
  price?: number | null;
}) {
  return (
    <div style={{ border: "1px solid " + colors.graphite, borderRadius: 12, padding: 22, background: colors.onyx, marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: draft ? 16 : 4, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.copper, textTransform: "uppercase", letterSpacing: "-0.02em" }}>{title}</div>
        <DraftButton kind={kind} leadId={leadId} agentId={agentId} hasDraft={Boolean(draft)} label={buttonLabel} redraftLabel={redraftLabel} />
      </div>

      {draft ? (
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: colors.paperWhite, marginBottom: 8 }}>{draft.subject}</div>
          {price !== undefined && price !== null && (
            <div style={{ fontSize: 13, color: colors.copper, fontWeight: 600, marginBottom: 10 }}>${price.toLocaleString()}</div>
          )}
          <div style={{ fontSize: 14, color: colors.bone, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{draft.body}</div>
        </div>
      ) : (
        <div style={{ fontSize: 13.5, color: colors.fog, fontStyle: "italic" }}>{emptyHint}</div>
      )}
    </div>
  );
}
