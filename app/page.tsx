import type { CSSProperties } from "react";
import Link from "next/link";
import OrbitDashboard from "@/components/OrbitDashboard";
import Reveal from "@/components/Reveal";
import HeroIntro from "@/components/HeroIntro";
import { getPublicAgentShowcase } from "@/lib/agents/store";
import { getPublicRecentActivity } from "@/lib/activity/store";
import { getPublicWorkspaceStats } from "@/lib/leads/store";
import { colors, fonts } from "@/lib/theme";

// Pulls real agent photos, pipeline stats, and activity from the database on
// every visit, not just at build time.
export const dynamic = "force-dynamic";

const BUTTON_GHOST: CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 500,
  color: colors.paperWhite,
  background: "transparent",
  border: "1px solid " + colors.paperWhite,
  cursor: "pointer",
};

const BUTTON_SOLID: CSSProperties = {
  display: "inline-block",
  padding: "10px 20px",
  borderRadius: 999,
  fontSize: 14,
  fontWeight: 500,
  color: "#000000",
  background: colors.paperWhite,
  border: "none",
  cursor: "pointer",
};

const EYEBROW: CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "0.28em",
  color: colors.copper,
  textTransform: "uppercase",
  textShadow: "0 0 24px rgba(204,145,102,.45)",
};

const CARD: CSSProperties = {
  background: colors.onyx,
  border: "1px solid " + colors.graphite,
  borderRadius: 10,
  padding: 24,
};

const FEATURES = [
  {
    title: "Finds the brands",
    body: "Your Research agent scans the web for brands that already sponsor creators in your niche, and drops candidates into a Pending list for you to approve.",
  },
  {
    title: "Pitches in your voice",
    body: "Initial Outreach writes a personalized first-touch pitch — a polished email or a short DM — that sounds like you, not a template.",
  },
  {
    title: "Prices the deal",
    body: "Proposal turns interest into a scoped, priced offer grounded in your audience, your niche, and your rate floor.",
  },
  {
    title: "Never lets it go cold",
    body: "Follow-up re-engages brands that went quiet with a short, friendly nudge that builds on what was already said.",
  },
  {
    title: "Books the call",
    body: "Scheduler parses plain-English requests like 'next Tuesday at 2pm' and puts real brand calls on your calendar.",
  },
  {
    title: "Shows you everything, live",
    body: "Watch your team work in real time on the signature dashboard — who's active, what they're doing, and how many deals are moving.",
  },
];

const STEPS = [
  { n: "01", title: "Tell us who you are", body: "Fill in your niche, platforms, audience, and rates once — your Media Kit." },
  { n: "02", title: "Your team gets to work", body: "Agents discover brands, research them, and draft pitches, proposals, and follow-ups." },
  { n: "03", title: "You stay in control", body: "New brands wait for your approval, and every pitch is a draft you review before it goes out." },
  { n: "04", title: "Send, book, close", body: "Open a pitch in your own mail app, book the call, and watch the deal move across your pipeline." },
];

export default async function LandingPage() {
  const [showcaseAgents, publicActivity, publicStats] = await Promise.all([
    getPublicAgentShowcase(),
    getPublicRecentActivity(50),
    getPublicWorkspaceStats(),
  ]);
  const activityItems = publicActivity
    .filter((a): a is { agentId: string; text: string } => Boolean(a.agentId))
    .map((a) => ({ agentId: a.agentId, text: a.text }));
  const activeAgents = new Set(activityItems.map((a) => a.agentId)).size;
  return (
    <main style={{ maxWidth: 1216, margin: "0 auto", padding: "0 24px" }}>
      <HeroIntro>
        {/* Nav */}
        <nav
          data-intro
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "24px 0",
          }}
        >
          <div style={{ fontFamily: fonts.serif, fontWeight: 500, fontSize: 22, letterSpacing: "0.01em", color: colors.paperWhite }}>
            Agentic Sales Team
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Link href="/sign-in" style={BUTTON_GHOST}>
              Log in
            </Link>
            <Link href="/sign-up" style={BUTTON_SOLID}>
              Sign up
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ paddingTop: 24, paddingBottom: 40 }}>
          <div data-intro style={{ textAlign: "center", marginBottom: 36 }}>
            <span style={EYEBROW}>AI Command Center</span>
            <div
              style={{
                width: 64,
                height: 2,
                background: "linear-gradient(90deg, transparent, " + colors.copper + ", transparent)",
                margin: "14px auto 0",
              }}
            />
          </div>

          <div data-intro>
            <OrbitDashboard agents={showcaseAgents} activity={activityItems} stats={{ activeAgents, ...publicStats }} />
          </div>

          <div style={{ textAlign: "center", maxWidth: 720, margin: "40px auto 0" }}>
            <h1
              data-intro
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: "clamp(30px, 4.6vw, 52px)",
                lineHeight: 1.13,
                letterSpacing: "0.01em",
                color: colors.paperWhite,
                margin: 0,
              }}
            >
              Your AI team closes brand deals while you create.
            </h1>
            <p data-intro style={{ fontSize: 18, lineHeight: 1.5, color: colors.mist, marginTop: 18 }}>
              Agentic Sales Team finds brands, pitches them in your own voice, prices the deal, follows up, and
              books the call — so you don&apos;t have to chase sponsorships between shoots.
            </p>
            <div data-intro style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 28 }}>
              <Link href="/sign-up" style={{ ...BUTTON_SOLID, padding: "12px 26px", fontSize: 15 }}>
                Get started free
              </Link>
              <a href="#features" style={{ ...BUTTON_GHOST, padding: "12px 26px", fontSize: 15 }}>
                See how it works
              </a>
            </div>
          </div>
        </section>
      </HeroIntro>

      {/* Features */}
      <Reveal>
        <section id="features" style={{ padding: "90px 0 20px" }}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 48px" }}>
            <div style={{ ...EYEBROW, marginBottom: 12 }}>What it does</div>
            <h2
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: 36,
                letterSpacing: "0.01em",
                color: colors.paperWhite,
                margin: 0,
              }}
            >
              Everything a manager would do — automated
            </h2>
            <p style={{ color: colors.mist, marginTop: 14, fontSize: 16, lineHeight: 1.5 }}>
              Five specialist agents cover a brand deal end to end, grounded in your real Media Kit.
            </p>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            {FEATURES.map((f) => (
              <div key={f.title} style={CARD}>
                <div style={{ fontSize: 16, fontWeight: 500, color: colors.paperWhite, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: colors.mist }}>{f.body}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* How it works */}
      <Reveal>
        <section style={{ padding: "90px 0 20px" }}>
          <div style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 48px" }}>
            <div style={{ ...EYEBROW, marginBottom: 12 }}>How it works</div>
            <h2
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: 36,
                letterSpacing: "0.01em",
                color: colors.paperWhite,
                margin: 0,
              }}
            >
              A few simple steps
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 20,
            }}
          >
            {STEPS.map((s) => (
              <div key={s.n} style={{ padding: "6px 4px" }}>
                <div
                  style={{
                    fontFamily: fonts.serif,
                    fontWeight: 400,
                    fontSize: 32,
                    letterSpacing: "0.01em",
                    color: colors.copper,
                    marginBottom: 12,
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 16, fontWeight: 500, color: colors.paperWhite, marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 14, lineHeight: 1.5, color: colors.mist }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Who it's for */}
      <Reveal>
        <section style={{ padding: "90px 0 20px" }}>
          <div
            style={{
              background: colors.carbon,
              border: "1px solid " + colors.graphite,
              borderRadius: 10,
              padding: "48px 32px",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontFamily: fonts.serif,
                fontWeight: 400,
                fontSize: 32,
                letterSpacing: "0.01em",
                color: colors.paperWhite,
                margin: 0,
              }}
            >
              Built for creators, not agencies
            </h2>
            <p style={{ color: colors.mist, marginTop: 16, fontSize: 16, lineHeight: 1.6, maxWidth: 620, marginInline: "auto" }}>
              If you&apos;re a content creator who wants brand deals but doesn&apos;t have the time — or a human
              manager — to chase them, Agentic Sales Team is the manager. You bring the audience; your AI team
              does the legwork.
            </p>
          </div>
        </section>
      </Reveal>

      {/* Closing CTA */}
      <Reveal>
        <section style={{ padding: "90px 0 48px", textAlign: "center" }}>
          <h2
            style={{
              fontFamily: fonts.serif,
              fontWeight: 400,
              fontSize: 36,
              letterSpacing: "0.01em",
              color: colors.paperWhite,
              margin: 0,
            }}
          >
            Ready to let your team start working?
          </h2>
          <p style={{ color: colors.mist, marginTop: 14, fontSize: 16 }}>
            Fill in your Media Kit once — your team takes it from there.
          </p>
          <div style={{ marginTop: 24 }}>
            <Link href="/sign-up" style={{ ...BUTTON_SOLID, padding: "13px 30px", fontSize: 15 }}>
              Sign up free
            </Link>
          </div>
        </section>
      </Reveal>

      {/* Footer */}
      <footer
        style={{
          borderTop: "1px solid " + colors.graphite,
          padding: "26px 0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ fontFamily: fonts.serif, fontSize: 16, color: colors.paperWhite }}>Agentic Sales Team</div>
        <div style={{ fontSize: 13, color: colors.fog }}>
          © {new Date().getFullYear()} Agentic Sales Team. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
