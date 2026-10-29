"use server";

import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createDal, type PublicSection } from "@/lib/db/access";
import { getDatabase } from "@/lib/db";
import {
  assessmentTests,
  assessments,
  athleteProfiles,
  exercises,
  invites,
  levelEvents,
  user,
  workoutSessions,
} from "@/lib/db/schema";
import { sendAppEmail } from "@/lib/email";
import { appOrigin, env, isAllowedEmail } from "@/lib/env";
import { normalizeHandle, validHandle } from "@/lib/handles";
import { currentProfile, currentSession, userRole } from "@/lib/session";
import { isIsoDate } from "@/lib/validators";

const SECTIONS: PublicSection[] = ["stats_charts", "level_history", "set_logs"];

function safeNext(value: FormDataEntryValue | null, fallback: string): string {
  const text = String(value ?? "");
  if (!text.startsWith("/") || text.startsWith("//")) return fallback;
  return text;
}

export async function saveSetup(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const startDate = String(formData.get("startDate") ?? "");
  if (!isIsoDate(startDate)) redirect("/setup?error=Choose+a+start+date");
  const units = formData.get("units") === "kg" ? "kg" : "lb";
  const hasBar = formData.get("hasBar") === "on";
  const timezone = String(formData.get("timezone") ?? "UTC");
  const name = String(formData.get("displayName") ?? "").trim().slice(0, 80);
  let zone = "UTC";
  try {
    Intl.DateTimeFormat("en-CA", { timeZone: timezone });
    zone = timezone;
  } catch {
    zone = "UTC";
  }
  const db = getDatabase().db;
  if (name) {
    await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  } else if (!session.user.name) {
    await db.update(user).set({ name: "Athlete", updatedAt: new Date() }).where(eq(user.id, session.user.id));
  }
  await db
    .insert(athleteProfiles)
    .values({
      userId: session.user.id,
      startDate,
      units,
      timezone: zone,
      hasBar,
      programId: "ct-12",
      programVersion: "1.0",
      visibility: "private",
    })
    .onConflictDoUpdate({
      target: athleteProfiles.userId,
      set: { startDate, units, timezone: zone, hasBar },
    });
  redirect("/today");
}

export async function saveProfile(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const units = formData.get("units") === "kg" ? "kg" : "lb";
  const hasBar = formData.get("hasBar") === "on";
  const reduceMotion = formData.get("reduceMotion") === "on";
  const name = String(formData.get("displayName") ?? "").trim().slice(0, 80);
  const db = getDatabase().db;
  const profile = await currentProfile(session.user.id);
  const prefs = { ...((profile?.prefs as Record<string, unknown> | null) ?? {}), reduceMotion };
  if (name) await db.update(user).set({ name, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  await db
    .update(athleteProfiles)
    .set({ units, hasBar, prefs })
    .where(eq(athleteProfiles.userId, session.user.id));
  revalidatePath("/settings");
  redirect("/settings");
}

export async function saveSharing(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const visibility = formData.get("visibility");
  const mode = visibility === "public" || visibility === "partner" ? visibility : "private";
  const sections = SECTIONS.filter((section) => formData.get(section) === "on");
  const rawHandle = String(formData.get("handle") ?? "");
  const handle = rawHandle.trim() ? normalizeHandle(rawHandle) : null;
  if (handle && !validHandle(handle)) redirect("/settings?error=Use+3+to+30+letters%2C+numbers%2C+or+hyphens");
  const dal = createDal(getDatabase().db);
  const result = await dal.setSharing({
    userId: session.user.id,
    visibility: mode,
    sections,
    handle,
    showName: formData.get("showName") === "on",
    showEmail: formData.get("showEmail") === "on",
    allowIndexing: formData.get("allowIndexing") === "on",
  });
  if (!result.ok) redirect(`/settings?error=${encodeURIComponent(result.error)}`);
  revalidatePath("/settings");
  revalidatePath("/u");
  redirect("/settings");
}

export async function completeSession(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const date = String(formData.get("date") ?? "");
  if (!isIsoDate(date)) redirect("/today");
  const type = formData.get("sessionType") === "assessment" || formData.get("sessionType") === "retest"
    ? formData.get("sessionType")
    : "workout";
  const energyRaw = Number(formData.get("energy"));
  const energy = energyRaw >= 1 && energyRaw <= 5 ? energyRaw : null;
  const db = getDatabase().db;
  const [existing] = await db
    .select()
    .from(workoutSessions)
    .where(and(eq(workoutSessions.userId, session.user.id), eq(workoutSessions.date, date), eq(workoutSessions.type, String(type))))
    .limit(1);
  if (!existing) redirect(`/today?on=${date}&error=${encodeURIComponent("Log at least one set first.")}`);
  await db
    .update(workoutSessions)
    .set({ completedAt: new Date(), energy })
    .where(and(eq(workoutSessions.id, existing.id), eq(workoutSessions.userId, session.user.id)));
  redirect(`/today?on=${date}`);
}

export async function acceptLevel(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const date = String(formData.get("date") ?? "");
  const patternId = String(formData.get("patternId") ?? "");
  const toExerciseId = String(formData.get("toExerciseId") ?? "");
  const dal = createDal(getDatabase().db);
  const result = await dal.acceptLevelUp(session.user.id, patternId, toExerciseId, date);
  const next = safeNext(formData.get("next"), `/today?on=${date}`);
  if (!result.ok) redirect(`${next}${next.includes("?") ? "&" : "?"}error=${encodeURIComponent(result.error)}`);
  revalidatePath("/today");
  revalidatePath("/ladders");
  redirect(next);
}

export async function setLevelManually(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const patternId = String(formData.get("patternId") ?? "");
  const exerciseId = String(formData.get("exerciseId") ?? "");
  const db = getDatabase().db;
  const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId)).limit(1);
  if (!exercise || exercise.patternId !== patternId || exercise.equipment === "kettlebell") {
    redirect("/ladders?error=That+exercise+is+not+on+this+ladder");
  }
  const profile = await currentProfile(session.user.id);
  if (exercise.equipment === "bar" && !profile?.hasBar) {
    redirect("/ladders?error=That+exercise+needs+a+pull-up+bar");
  }
  await db.insert(levelEvents).values({
    id: crypto.randomUUID(),
    userId: session.user.id,
    patternId,
    toExerciseId: exerciseId,
    reason: "manual",
    at: new Date(),
  });
  await createDal(db).audit(session.user.id, "level_manual");
  revalidatePath("/ladders");
  revalidatePath("/today");
  redirect("/ladders");
}

export async function saveAssessment(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  const phase = formData.get("phase") === "retest" ? "retest" : "baseline";
  const date = String(formData.get("date") ?? "");
  const db = getDatabase().db;
  const tests = await db.select().from(assessmentTests);
  for (const test of tests) {
    const exerciseId = String(formData.get(`exercise:${test.id}`) ?? "");
    const resultText = String(formData.get(`result:${test.id}`) ?? "").trim().slice(0, 80);
    if (!exerciseId && !resultText) continue;
    let level: number | null = null;
    if (exerciseId) {
      const [exercise] = await db.select().from(exercises).where(eq(exercises.id, exerciseId)).limit(1);
      if (exercise && exercise.patternId === test.patternId) {
        level = exercise.level;
        await db.insert(levelEvents).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          patternId: exercise.patternId,
          toExerciseId: exercise.id,
          reason: "baseline",
          at: new Date(),
        });
      }
    }
    await db
      .insert(assessments)
      .values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        testId: test.id,
        phase,
        level,
        resultText: resultText || null,
        resultValue: Number.isFinite(Number(resultText)) && resultText !== "" ? Number(resultText) : null,
      })
      .onConflictDoUpdate({
        target: [assessments.userId, assessments.testId, assessments.phase],
        set: {
          level,
          resultText: resultText || null,
          resultValue: Number.isFinite(Number(resultText)) && resultText !== "" ? Number(resultText) : null,
          recordedAt: new Date(),
        },
      });
  }
  redirect(isIsoDate(date) ? `/today?on=${date}` : "/today");
}

export async function sendInvite(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  if (userRole(session.user) !== "owner") redirect("/settings?error=Only+the+owner+can+invite");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!isAllowedEmail(email)) redirect("/settings?error=That+address+is+not+on+the+allowlist");
  if (email === session.user.email.toLowerCase()) redirect("/settings?error=You+already+have+an+account");
  const db = getDatabase().db;
  const active = await db.select({ id: user.id }).from(user).where(isNull(user.deactivatedAt));
  if (active.length >= env().MAX_USERS) redirect("/settings?error=The+account+limit+has+been+reached");
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await db.insert(invites).values({
    id: crypto.randomUUID(),
    email,
    invitedBy: session.user.id,
    tokenHash,
    expiresAt,
  });
  const url = `${appOrigin()}/sign-in`;
  await sendAppEmail({
    to: email,
    subject: "You're invited to Calisthenics Tracker",
    text: `You have 72 hours to sign in. Open ${url} and request a link for this address. The invite works once.`,
    url,
  });
  await createDal(db).audit(session.user.id, "invite_sent");
  redirect("/settings");
}

export async function revokeInvite(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  if (userRole(session.user) !== "owner") redirect("/settings");
  const id = String(formData.get("inviteId") ?? "");
  await getDatabase()
    .db.update(invites)
    .set({ revokedAt: new Date() })
    .where(and(eq(invites.id, id), eq(invites.invitedBy, session.user.id), isNull(invites.acceptedAt)));
  redirect("/settings");
}

export async function deleteAccount(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/sign-in");
  if (String(formData.get("confirm") ?? "") !== "DELETE") {
    redirect("/settings?error=Type+DELETE+to+confirm");
  }
  const created = new Date(session.session.createdAt).getTime();
  if (Number.isNaN(created) || Date.now() - created > 12 * 60 * 60 * 1000) {
    redirect("/settings?error=Sign+in+again+before+deleting+your+account");
  }
  const db = getDatabase().db;
  await createDal(db).audit(session.user.id, "account_deleted");
  await db.update(user).set({ deactivatedAt: new Date() }).where(eq(user.id, session.user.id));
  await db.delete(user).where(eq(user.id, session.user.id));
  redirect("/sign-in");
}
