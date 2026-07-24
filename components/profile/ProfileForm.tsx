"use client";
import { useState, useTransition } from "react";
import type { CSSProperties, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { colors, fonts } from "@/lib/theme";
import { saveMyProfile } from "@/lib/profile/store";
import type { CreatorProfile, PlatformEntry } from "@/lib/profile/types";

type FormState = Omit<CreatorProfile, "userId">;

const PLATFORM_OPTIONS = ["TikTok", "Instagram", "YouTube", "X", "Twitch", "LinkedIn", "Other"];

function emptyPlatform(): PlatformEntry {
  return { platform: "TikTok", handle: "", followers: null, engagementRate: null };
}

const inputStyle: CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  background: "transparent",
  border: "1px solid " + colors.graphite,
  color: colors.bone,
  fontSize: 14.5,
  fontFamily: "inherit",
  outline: "none",
};
const labelStyle: CSSProperties = { fontSize: 13.5, fontWeight: 600, color: colors.bone, marginBottom: 8, display: "block" };
const hintStyle: CSSProperties = { fontSize: 12.5, color: colors.fog, marginTop: 8 };

export default function ProfileForm({ mode, initial }: { mode: "wizard" | "edit"; initial: CreatorProfile | null }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<FormState>({
    niche: initial?.niche ?? "",
    bio: initial?.bio ?? "",
    platforms: initial?.platforms?.length ? initial.platforms : [emptyPlatform()],
    audience: initial?.audience ?? {},
    tone: initial?.tone ?? "",
    pastDeals: initial?.pastDeals ?? "",
    rateFloor: initial?.rateFloor ?? null,
  });

  function updatePlatform(i: number, patch: Partial<PlatformEntry>) {
    setForm((f) => ({ ...f, platforms: f.platforms.map((p, idx) => (idx === i ? { ...p, ...patch } : p)) }));
  }
  function addPlatform() {
    setForm((f) => ({ ...f, platforms: [...f.platforms, emptyPlatform()] }));
  }
  function removePlatform(i: number) {
    setForm((f) => ({ ...f, platforms: f.platforms.filter((_, idx) => idx !== i) }));
  }

  function submit() {
    const cleanedPlatforms = form.platforms.filter((p) => p.handle.trim().length > 0);
    startTransition(async () => {
      await saveMyProfile({ ...form, platforms: cleanedPlatforms });
      if (mode === "wizard") {
        router.push("/dashboard");
        router.refresh();
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    });
  }

  function NicheSection() {
    return (
      <div>
        <label style={labelStyle}>What&apos;s your niche?</label>
        <input
          style={inputStyle}
          value={form.niche}
          onChange={(e) => setForm((f) => ({ ...f, niche: e.target.value }))}
          placeholder="e.g. Sustainable beauty, fitness, personal finance"
        />
        <div style={{ marginTop: 18 }}>
          <label style={labelStyle}>A short bio (optional)</label>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="A couple of sentences about you and what you create"
          />
        </div>
      </div>
    );
  }

  function PlatformsSection() {
    return (
      <div>
        <label style={labelStyle}>Where do you post, and what are your numbers?</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {form.platforms.map((p, i) => (
            <div
              key={i}
              style={{
                border: "1px solid " + colors.graphite,
                borderRadius: 10,
                padding: 14,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 10,
              }}
            >
              <select style={inputStyle} value={p.platform} onChange={(e) => updatePlatform(i, { platform: e.target.value })}>
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <input style={inputStyle} value={p.handle} onChange={(e) => updatePlatform(i, { handle: e.target.value })} placeholder="@handle" />
              <input
                style={inputStyle}
                type="number"
                value={p.followers ?? ""}
                onChange={(e) => updatePlatform(i, { followers: e.target.value ? Number(e.target.value) : null })}
                placeholder="Followers"
              />
              <input
                style={inputStyle}
                type="number"
                step="0.1"
                value={p.engagementRate ?? ""}
                onChange={(e) => updatePlatform(i, { engagementRate: e.target.value ? Number(e.target.value) : null })}
                placeholder="Engagement rate %"
              />
              {form.platforms.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePlatform(i)}
                  style={{
                    gridColumn: "1 / -1",
                    justifySelf: "start",
                    background: "transparent",
                    border: "none",
                    color: colors.errorRed,
                    fontSize: 12.5,
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addPlatform}
          style={{
            marginTop: 10,
            background: "transparent",
            border: "1px solid " + colors.steel,
            color: colors.bone,
            borderRadius: 999,
            padding: "7px 14px",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          + Add another platform
        </button>
      </div>
    );
  }

  function AudienceSection() {
    return (
      <div>
        <label style={labelStyle}>Who&apos;s your audience?</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            style={inputStyle}
            value={form.audience.age ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, audience: { ...f.audience, age: e.target.value } }))}
            placeholder="Age range, e.g. 18–34"
          />
          <input
            style={inputStyle}
            value={form.audience.geo ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, audience: { ...f.audience, geo: e.target.value } }))}
            placeholder="Where they're based, e.g. mostly US & UK"
          />
          <input
            style={inputStyle}
            value={form.audience.gender ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, audience: { ...f.audience, gender: e.target.value } }))}
            placeholder="Gender split, e.g. 70% women"
          />
        </div>
        <div style={hintStyle}>Rough numbers are fine — this just helps agents pitch the right brands.</div>
      </div>
    );
  }

  function ToneSection() {
    return (
      <div>
        <label style={labelStyle}>How would you describe your content style / voice?</label>
        <textarea
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          value={form.tone}
          onChange={(e) => setForm((f) => ({ ...f, tone: e.target.value }))}
          placeholder="e.g. Warm, funny, a little chaotic — I keep things real and not overly polished"
        />
      </div>
    );
  }

  function PastDealsSection() {
    return (
      <div>
        <label style={labelStyle}>Any brand partnerships or campaigns so far?</label>
        <textarea
          style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
          value={form.pastDeals}
          onChange={(e) => setForm((f) => ({ ...f, pastDeals: e.target.value }))}
          placeholder="e.g. Worked with Glossier on a launch campaign, ongoing ambassador for a local coffee brand…"
        />
        <div style={hintStyle}>Totally fine to leave blank if you&apos;re just getting started.</div>
      </div>
    );
  }

  function RateFloorSection() {
    return (
      <div>
        <label style={labelStyle}>What&apos;s the least you&apos;d take for a single sponsored post?</label>
        <input
          style={inputStyle}
          type="number"
          value={form.rateFloor ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, rateFloor: e.target.value ? Number(e.target.value) : null }))}
          placeholder="e.g. 500"
        />
        <div style={hintStyle}>In US dollars. Your Proposal agent uses this as a floor — it won&apos;t price below it.</div>
      </div>
    );
  }

  function ReviewSection() {
    return (
      <div>
        <label style={labelStyle}>Here&apos;s what we&apos;ve got</label>
        <div style={{ fontSize: 13.5, color: colors.mist, lineHeight: 1.8 }}>
          <div>
            <b style={{ color: colors.bone }}>Niche:</b> {form.niche || "—"}
          </div>
          <div>
            <b style={{ color: colors.bone }}>Platforms:</b>{" "}
            {form.platforms
              .filter((p) => p.handle)
              .map((p) => p.platform + " @" + p.handle)
              .join(", ") || "—"}
          </div>
          <div>
            <b style={{ color: colors.bone }}>Rate floor:</b> {form.rateFloor ? "$" + form.rateFloor : "—"}
          </div>
        </div>
        <div style={hintStyle}>You can change any of this later from your Profile page.</div>
      </div>
    );
  }

  const SECTION_MAP: Record<string, { title: string; render: () => ReactElement }> = {
    niche: { title: "Your niche", render: NicheSection },
    platforms: { title: "Your platforms", render: PlatformsSection },
    audience: { title: "Your audience", render: AudienceSection },
    tone: { title: "Your voice", render: ToneSection },
    pastDeals: { title: "Past deals", render: PastDealsSection },
    rateFloor: { title: "Your rate floor", render: RateFloorSection },
    review: { title: "Review", render: ReviewSection },
  };

  if (mode === "edit") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {(["niche", "platforms", "audience", "tone", "pastDeals", "rateFloor"] as const).map((key) => (
          <div key={key}>{SECTION_MAP[key].render()}</div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          {saved && <span style={{ color: colors.sage, fontSize: 13.5 }}>Saved.</span>}
        </div>
      </div>
    );
  }

  const steps = ["niche", "platforms", "audience", "tone", "pastDeals", "rateFloor", "review"] as const;
  const currentKey = steps[step];
  const section = SECTION_MAP[currentKey];
  const isLast = step === steps.length - 1;

  return (
    <div style={{ width: "min(560px, 92vw)", background: colors.onyx, border: "1px solid " + colors.graphite, borderRadius: 16, padding: 36 }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
        {steps.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? colors.copper : colors.graphite }} />
        ))}
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.copper, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: 8 }}>
        Step {step + 1} of {steps.length}
      </div>
      <h2 style={{ fontFamily: fonts.serif, fontWeight: 400, fontSize: 24, color: colors.paperWhite, margin: "0 0 20px" }}>{section.title}</h2>
      {section.render()}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          style={{
            background: "transparent",
            border: "1px solid " + colors.steel,
            color: colors.bone,
            borderRadius: 999,
            padding: "9px 20px",
            fontSize: 14,
            cursor: step === 0 ? "default" : "pointer",
            opacity: step === 0 ? 0.4 : 1,
          }}
        >
          Back
        </button>
        {isLast ? (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "9px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {isPending ? "Saving…" : "Finish"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}
            style={{
              background: colors.paperWhite,
              color: "#000",
              border: "none",
              borderRadius: 999,
              padding: "9px 24px",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Next
          </button>
        )}
      </div>
    </div>
  );
}
