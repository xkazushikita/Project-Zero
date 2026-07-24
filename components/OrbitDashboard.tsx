"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AGENT_TYPES, TEAM_TEMPLATES } from "@/lib/agentTypes";
import { demoStats, demoActivity, type WorkspaceStats, type ActivityItem } from "@/lib/demoData";
import { listActiveAgentIds } from "@/lib/jobs/store";
import { statusMeta } from "@/lib/status";
import { av, hubIcon, agentActivityType } from "@/lib/visuals";
import { colors } from "@/lib/theme";
import { css, Box } from "./primitives";

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M followers";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K followers";
  return n + " followers";
}

// [animation, tint] per activity type — the glyph itself comes from hubIcon().
const hubIcons: Record<string, [string, string]> = {
  email: ["iconFly 2.6s ease-in-out infinite", colors.copper],
  call: ["iconRing 1.6s ease-in-out infinite", colors.sage],
  research: ["iconSwing 2.4s ease-in-out infinite", colors.mist],
  writing: ["iconPop 2.4s ease-in-out infinite", colors.bone],
  meeting: ["iconPop 2.8s ease-in-out infinite", colors.copper],
  analytics: ["iconPop 3s ease-in-out infinite", colors.silver],
  idle: ["breathe 3s ease-in-out infinite", colors.steel],
  alert: ["iconPop 1.8s ease-in-out infinite", colors.errorRed],
};

// Minimal shape the orbit actually needs — both the static presets and the
// creator's real agents/teams (from lib/agents/store) satisfy this.
export interface OrbitAgent {
  id: string;
  name: string;
  initials: string;
  color: string;
  status: "working" | "waiting" | "offline" | "error";
  capabilities: string[];
  avatarUrl?: string | null;
}
export interface OrbitTeam {
  id: string;
  name: string;
  members: string[];
}

export default function OrbitDashboard({
  agents: agentsProp,
  teams: teamsProp,
  stats: statsProp,
  activity: activityProp,
  chromeAbove = 178,
  live = false,
  creatorAvatarUrl = null,
  creatorFollowers = null,
}: {
  agents?: OrbitAgent[];
  teams?: OrbitTeam[];
  stats?: WorkspaceStats;
  activity?: ActivityItem[];
  // Vertical space (px) already used by page content above this card (heading, stat tiles, etc.)
  // — the card sizes itself around whatever's left, so it never overflows the viewport.
  chromeAbove?: number;
  // Polls for genuinely-running tasks every few seconds so the orbit updates
  // itself the instant a task starts anywhere in the app — the real Dashboard
  // turns this on; the logged-out marketing hero leaves it off.
  live?: boolean;
  // When TikTok is connected, the creator's own photo + follower count take over the center hub.
  creatorAvatarUrl?: string | null;
  creatorFollowers?: number | null;
} = {}) {
  const router = useRouter();
  const [hubTeam, setHubTeam] = useState("all");
  const [dims, setDims] = useState({ w: 1280, h: 800 });
  const [reduced, setReduced] = useState(false);
  const [tick, setTick] = useState(0);
  const [liveWorkingIds, setLiveWorkingIds] = useState<string[]>([]);

  // No real data passed in (the marketing landing page) → fall back to the static preset showcase.
  const agents: OrbitAgent[] = agentsProp ?? AGENT_TYPES.map((a) => ({ ...a, avatarUrl: null }));
  const teams = teamsProp ?? TEAM_TEMPLATES;
  const byId = (id: string) => agents.find((a) => a.id === id);
  const ws = statsProp ?? demoStats;
  const acts = activityProp && activityProp.length > 0 ? activityProp : demoActivity;
  const paMap = new Map(ws.perAgent.map((p) => [p.agentId, p]));
  const maxOut = Math.max(1, ...ws.perAgent.map((p) => p.leadsWorked));

  useEffect(() => {
    const on = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    const hub = setInterval(() => setTick((t) => t + 1), 3200);
    return () => clearInterval(hub);
  }, []);
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    const poll = () => {
      listActiveAgentIds().then((ids) => {
        if (!cancelled) setLiveWorkingIds(ids);
      });
    };
    poll();
    const id = setInterval(poll, 3500);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [live]);

  const hubMembers =
    hubTeam === "all"
      ? agents.slice(0, 8)
      : ((teams.find((t) => t.id === hubTeam) || teams[0])?.members ?? []).map((id) => byId(id));
  const validMembers = hubMembers.filter(Boolean) as typeof agents;
  const HN = Math.max(validMembers.length, 1);
  const nodes = validMembers.map((a, i) => {
    const ang = ((-90 + (i * 360) / HN) * Math.PI) / 180;
    const x = Math.round(380 + Math.cos(ang) * 272);
    const y = Math.round(262 + Math.sin(ang) * 186);
    const type = agentActivityType(a.capabilities);
    const ic = hubIcons[type];
    const isLive = liveWorkingIds.includes(a.id);
    const effectiveStatus = isLive ? "working" : a.status;
    const m = statusMeta(effectiveStatus);
    const latest = acts.find((f) => f.agentId === a.id);
    const liveAgent = { ...a, status: effectiveStatus };
    return {
      a: liveAgent,
      i,
      x,
      y,
      m,
      ic,
      type,
      badge: isLive ? "Working right now…" : latest ? latest.text.slice(0, 40) : a.status === "working" ? "Working…" : "Idle",
    };
  });
  const collabs = HN >= 5 ? [[0, 2], [1, 4]] : [];

  const hubWorking = Math.max(ws.activeAgents, liveWorkingIds.length);
  const leadsWorked = ws.leadsWorked;
  const tasksRunning = ws.tasksRunning;
  const monthLabel = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();

  const actLine = (f?: { agentId: string; text: string }) => (f ? (byId(f.agentId)?.name ?? "Agent") + " " + f.text : "");
  const hubLive = actLine(acts[0]).slice(0, 90);
  const hubLive2 = actLine(acts[1]).slice(0, 90);

  const hubCardW = Math.max(dims.w - 52 - 2, 320);
  const hubScale = Math.max(0.7, Math.min((dims.h - chromeAbove - 72) / 524, (hubCardW - 40) / 760, 1.45));
  const teamPills = [{ id: "all", label: "Everyone" }].concat(teams.map((t) => ({ id: t.id, label: t.name })));

  return (
    <div
      style={css(
        "position:relative;background:radial-gradient(900px 520px at 50% 38%,#121317,#08080a 75%);border:1px solid " +
          colors.graphite +
          ";border-radius:20px;height:min(640px,calc(100dvh - " +
          chromeAbove +
          "px));min-height:480px;overflow:hidden"
      )}
    >
      <div style={css("position:absolute;top:16px;left:20px;right:150px;display:flex;gap:8px;z-index:3;flex-wrap:wrap")}>
        {teamPills.map((p) => (
          <Box
            key={p.id}
            onClick={() => setHubTeam(p.id)}
            style={
              "font-size:11.5px;font-weight:600;border-radius:99px;padding:5px 13px;cursor:pointer;transition:all .12s;backdrop-filter:blur(6px);" +
              (hubTeam === p.id
                ? "background:#ffffff;color:#08080a;border:1px solid #ffffff"
                : "background:transparent;color:" + colors.fog + ";border:1px solid " + colors.steel)
            }
            styleHover="border-color:#ffffff"
          >
            {p.label}
          </Box>
        ))}
      </div>
      {hubWorking > 0 && (
        <div
          style={css(
            "position:absolute;top:16px;right:20px;display:flex;align-items:center;gap:6px;font-size:11px;font-weight:600;color:" +
              colors.sage +
              ";background:transparent;border:1px solid rgba(143,177,151,.45);border-radius:99px;padding:4px 12px;z-index:3;backdrop-filter:blur(6px)"
          )}
        >
          <span style={css("width:6px;height:6px;border-radius:50%;background:" + colors.sage + ";animation:pulse 2s infinite")} />
          Working now
        </div>
      )}

      <div
        style={css(
          "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(" +
            hubScale.toFixed(3) +
            ");width:760px;height:524px"
        )}
      >
        <div
          style={css(
            "position:absolute;left:380px;top:262px;width:560px;height:380px;transform:translate(-50%,-50%);border:1px solid rgba(255,255,255,.06);border-radius:50%"
          )}
        />
        <div
          style={css(
            "position:absolute;left:380px;top:262px;width:400px;height:270px;transform:translate(-50%,-50%);border:1px solid rgba(255,255,255,.06);border-radius:50%"
          )}
        />

        <svg width="760" height="524" viewBox="0 0 760 524" style={{ position: "absolute", left: 0, top: 0 }}>
          {nodes.map((n) => (
            <line
              key={"l" + n.i}
              x1="380"
              y1="262"
              x2={n.x}
              y2={n.y}
              stroke={colors.slate}
              strokeWidth="1.5"
              strokeDasharray="3 7"
              style={{ animation: "dashMove 1.8s linear infinite" }}
            />
          ))}
          {!reduced &&
            nodes.map((n) => (
              <circle key={"p" + n.i} r="2.6" fill={colors.copper} opacity="0.9">
                <animateMotion
                  dur={2.4 + (n.i % 4) * 0.6 + "s"}
                  begin={n.i * 0.4 + "s"}
                  repeatCount="indefinite"
                  path={"M" + n.x + " " + n.y + " L380 262"}
                />
              </circle>
            ))}
          {collabs.map((c, i) => (
            <line
              key={"c" + i}
              x1={nodes[c[0]].x}
              y1={nodes[c[0]].y}
              x2={nodes[c[1]].x}
              y2={nodes[c[1]].y}
              stroke="rgba(204,145,102,.5)"
              strokeWidth="1.5"
              strokeDasharray="2 6"
              style={{ animation: "dashMove 1.2s linear infinite" }}
            />
          ))}
        </svg>

        {/* center hub */}
        <div
          style={css(
            "position:absolute;left:380px;top:262px;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:10px;z-index:2"
          )}
        >
          <div style={css("position:relative;width:124px;height:124px;display:flex;align-items:center;justify-content:center")}>
            <div
              style={css(
                "position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;border:2px solid rgba(204,145,102,.4);animation:ringPulse 3s ease-out infinite"
              )}
            />
            <div
              style={css(
                "position:absolute;left:0;top:0;right:0;bottom:0;border-radius:50%;border:2px solid rgba(204,145,102,.4);animation:ringPulse 3s ease-out 1.5s infinite"
              )}
            />
            <div
              style={css(
                "width:124px;height:124px;border-radius:50%;background:conic-gradient(" +
                  colors.copper +
                  " 0 100%,rgba(255,255,255,.1) 100% 100%);display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(204,145,102,.3)"
              )}
            >
              <div
                style={css(
                  "width:106px;height:106px;border-radius:50%;background:#040406;display:flex;flex-direction:column;align-items:center;justify-content:center;overflow:hidden;position:relative"
                )}
              >
                {creatorAvatarUrl ? (
                  <>
                    <img src={creatorAvatarUrl} alt="You" style={css("position:absolute;inset:0;width:100%;height:100%;object-fit:cover")} />
                    {creatorFollowers !== null && (
                      <div
                        style={css(
                          "position:absolute;left:0;right:0;bottom:0;padding:5px 0 6px;text-align:center;background:linear-gradient(to top,rgba(0,0,0,.85),rgba(0,0,0,0));font-size:10.5px;font-weight:700;letter-spacing:.02em;color:#ffffff"
                        )}
                      >
                        {formatFollowers(creatorFollowers)}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={css("font-family:'Playfair Display',serif;font-size:26px;font-weight:500;letter-spacing:.01em;color:#ffffff;line-height:1")}>
                      {leadsWorked}
                    </div>
                    <div
                      style={css(
                        "font-size:8.5px;font-weight:600;letter-spacing:.1em;color:" +
                          colors.mist +
                          ";margin-top:5px;text-align:center;line-height:1.4"
                      )}
                    >
                      BRANDS WORKED
                      <br />
                      {monthLabel}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <div style={css("display:flex;gap:8px")}>
            <div
              style={css(
                "display:inline-flex;align-items:center;gap:5px;font-size:10.5px;font-weight:600;color:" +
                  colors.bone +
                  ";background:rgba(255,255,255,.05);border:1px solid " +
                  colors.graphite +
                  ";border-radius:99px;padding:4px 11px;backdrop-filter:blur(6px)"
              )}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill={colors.copper} style={{ flex: "none" }} aria-hidden="true">
                <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
              </svg>
              {hubWorking} working · {tasksRunning} tasks
            </div>
          </div>
        </div>

        {/* agent nodes */}
        {nodes.map((n) => (
          <div
            key={n.a.id}
            aria-label={n.a.name}
            role="button"
            tabIndex={0}
            onClick={() => router.push("/agents/" + n.a.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push("/agents/" + n.a.id);
              }
            }}
            className="asteam-orbit-node"
            style={css(
              "position:absolute;left:" +
                n.x +
                "px;top:" +
                n.y +
                "px;transform:translate(-50%,-50%);width:200px;display:flex;flex-direction:column;align-items:center;z-index:2;cursor:pointer"
            )}
          >
            <div
              style={css(
                "display:flex;flex-direction:column;align-items:center;gap:6px;animation:floaty " +
                  (5 + (n.i % 3)) +
                  "s ease-in-out " +
                  (n.i * 0.45).toFixed(2) +
                  "s infinite"
              )}
            >
              <div style={css("position:relative")}>
                <div className="asteam-orbit-ring" style={css("padding:3px;border-radius:50%;background:#0c0c10;box-shadow:0 0 0 2px " + n.a.color + "55")}>
                  {n.a.avatarUrl ? (
                    <img
                      src={n.a.avatarUrl}
                      alt={n.a.initials}
                      style={css("width:46px;height:46px;border-radius:50%;object-fit:cover;border:2px solid #08080a;flex:none")}
                    />
                  ) : (
                    <div style={css(av(n.a, 46) + ";border:2px solid #08080a")}>{n.a.initials}</div>
                  )}
                </div>
                <div
                  style={css(
                    "position:absolute;top:-8px;right:-10px;width:22px;height:22px;border-radius:50%;background:#ffffff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 1px rgba(0,0,0,.4);animation:" +
                      n.ic[0]
                  )}
                >
                  <span style={css(hubIcon(n.type, n.ic[1]))} />
                </div>
              </div>
              <div style={css("display:flex;align-items:center;gap:5px;margin-top:2px")}>
                <span
                  style={css(
                    "width:7px;height:7px;border-radius:50%;background:" +
                      n.m.dot +
                      ";flex:none;" +
                      (n.a.status === "working" ? "animation:pulse 2s infinite" : "")
                  )}
                />
                <span style={css("font-size:12px;font-weight:700;color:" + colors.bone)}>{n.a.name}</span>
              </div>
              <div style={css("width:60px;height:3px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden")}>
                <div
                  style={css(
                    "width:" +
                      Math.round(((paMap.get(n.a.id)?.leadsWorked ?? 0) / maxOut) * 100) +
                      "%;height:100%;border-radius:2px;background:" +
                      colors.gildedGradient
                  )}
                />
              </div>
              <div
                style={css(
                  "display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:600;color:" +
                    colors.bone +
                    ";background:rgba(255,255,255,.06);border:1px solid " +
                    colors.graphite +
                    ";backdrop-filter:blur(6px);border-radius:99px;padding:4px 10px;white-space:nowrap;max-width:196px;overflow:hidden;text-overflow:ellipsis;animation:" +
                    (tick % 2 ? "badgePopA" : "badgePopB") +
                    " .4s ease"
                )}
              >
                <span>{n.badge}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* floating particles */}
      <div
        style={css(
          "position:absolute;left:18%;bottom:30%;width:5px;height:5px;border-radius:50%;background:rgba(204,145,102,.5);animation:rise 7s ease-in-out infinite"
        )}
      />
      <div
        style={css(
          "position:absolute;left:72%;bottom:24%;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.3);animation:rise 9s ease-in-out 2s infinite"
        )}
      />
      <div
        style={css(
          "position:absolute;left:48%;bottom:18%;width:3px;height:3px;border-radius:50%;background:rgba(204,145,102,.4);animation:rise 8s ease-in-out 4s infinite"
        )}
      />
      <div
        style={css(
          "position:absolute;left:85%;bottom:55%;width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.25);animation:rise 10s ease-in-out 1s infinite"
        )}
      />

      {/* live activity labels */}
      <div
        style={css(
          "position:absolute;bottom:16px;left:20px;display:flex;flex-direction:column;align-items:flex-start;gap:6px;z-index:3;max-width:70%"
        )}
      >
        <div
          style={css(
            "display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:" +
              colors.fog +
              ";background:rgba(255,255,255,.04);border:1px solid " +
              colors.graphite +
              ";border-radius:99px;padding:5px 13px;backdrop-filter:blur(8px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;opacity:.8"
          )}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={colors.fog} style={{ flex: "none" }} aria-hidden="true">
            <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />
          </svg>
          {hubLive2}
        </div>
        <div
          style={css(
            "display:flex;align-items:center;gap:7px;font-size:11px;font-weight:600;color:" +
              colors.bone +
              ";background:rgba(255,255,255,.06);border:1px solid " +
              colors.graphite +
              ";border-radius:99px;padding:5px 13px;backdrop-filter:blur(8px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%"
          )}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill={colors.copper} style={{ flex: "none" }} aria-hidden="true">
            <path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3L12 3Z" />
          </svg>
          {hubLive}
        </div>
      </div>
    </div>
  );
}
