"use server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getDb, isDbConfigured } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DEFAULT_NOTIFICATIONS, type NotificationPrefs } from "./types";

export async function getNotificationPrefs(): Promise<NotificationPrefs> {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return DEFAULT_NOTIFICATIONS;
  const db = getDb()!;
  const row = await db.select({ notifications: users.notifications }).from(users).where(eq(users.id, userId)).limit(1);
  return { ...DEFAULT_NOTIFICATIONS, ...((row[0]?.notifications as Partial<NotificationPrefs>) ?? {}) };
}

export async function updateNotification(key: keyof NotificationPrefs, value: boolean) {
  const { userId } = await auth();
  if (!userId || !isDbConfigured()) return;
  const db = getDb()!;
  const row = await db.select({ notifications: users.notifications }).from(users).where(eq(users.id, userId)).limit(1);
  const current = { ...DEFAULT_NOTIFICATIONS, ...((row[0]?.notifications as Partial<NotificationPrefs>) ?? {}) };
  const next = { ...current, [key]: value };
  await db.update(users).set({ notifications: next }).where(eq(users.id, userId));
  revalidatePath("/settings");
}
