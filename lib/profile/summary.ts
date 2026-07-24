import type { CreatorProfile } from "./types";

// The Media Kit boiled down to plain text — threaded into every AI engine as creatorContext.
export function profileSummary(p: CreatorProfile | null): string {
  if (!p) return "";
  const lines: string[] = [];
  if (p.niche) lines.push("Niche: " + p.niche);
  if (p.bio) lines.push("Bio: " + p.bio);
  if (p.platforms.length) {
    lines.push(
      "Platforms: " +
        p.platforms
          .map(
            (pl) =>
              pl.platform +
              (pl.handle ? " @" + pl.handle : "") +
              (pl.followers ? " — " + pl.followers.toLocaleString() + " followers" : "") +
              (pl.engagementRate ? ", " + pl.engagementRate + "% engagement" : "")
          )
          .join("; ")
    );
  }
  const aud = [p.audience.age, p.audience.geo, p.audience.gender].filter(Boolean).join(", ");
  if (aud) lines.push("Audience: " + aud);
  if (p.tone) lines.push("Tone/voice: " + p.tone);
  if (p.pastDeals) lines.push("Past brand deals: " + p.pastDeals);
  if (p.rateFloor) lines.push("Rate floor: $" + p.rateFloor + " minimum per deliverable");
  return lines.join("\n");
}

export function creatorDisplayName(name: string | null | undefined, niche: string | null | undefined): string {
  if (name) return name;
  if (niche) return niche + " creator";
  return "This creator";
}
