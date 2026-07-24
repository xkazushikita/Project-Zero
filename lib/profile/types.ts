export interface PlatformEntry {
  platform: string;
  handle: string;
  followers: number | null;
  engagementRate: number | null;
}

export interface Audience {
  age?: string;
  geo?: string;
  gender?: string;
}

export interface CreatorProfile {
  userId: string;
  niche: string;
  bio: string;
  platforms: PlatformEntry[];
  audience: Audience;
  tone: string;
  pastDeals: string;
  rateFloor: number | null;
}

// Gates onboarding: the essentials that must be filled before using the rest of the app.
export function isProfileComplete(p: Pick<CreatorProfile, "niche" | "platforms" | "rateFloor"> | null): boolean {
  if (!p) return false;
  return Boolean(p.niche && p.platforms.length > 0 && p.rateFloor);
}
