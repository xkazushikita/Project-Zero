import "server-only";
import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { getDb, isDbConfigured } from "@/lib/db";
import { users } from "@/lib/db/schema";

export interface AppUser {
  id: string;
}

// Reads the signed-in user (Clerk owns auth) and, on their first authenticated
// request, upserts a local row keyed by the Clerk user id.
export async function currentUser(): Promise<AppUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  if (isDbConfigured()) {
    const db = getDb()!;
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, userId)).limit(1);
    if (existing.length === 0) {
      const clerkUser = await clerkCurrentUser();
      const email = clerkUser?.emailAddresses?.[0]?.emailAddress ?? null;
      const name = clerkUser ? [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null : null;
      await db.insert(users).values({ id: userId, email, name }).onConflictDoNothing();
    }
  }

  return { id: userId };
}
