import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDal } from "../lib/db/access";
import type { AppDatabase } from "../lib/db";
import { migrate } from "../lib/db/migrate";
import * as schema from "../lib/db/schema";
import { athleteProfiles, exerciseLogs, setLogs, user, workoutSessions } from "../lib/db/schema";
import { seedReference } from "../scripts/seed-lib";

let client: PGlite;
let db: AppDatabase;
let dal: ReturnType<typeof createDal>;

const ownerId = "11111111-1111-4111-8111-111111111111";
const partnerId = "22222222-2222-4222-8222-222222222222";

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  await migrate({
    db,
    kind: "pglite",
    exec: async (statement) => {
      await client.exec(statement);
    },
    close: async () => {
      await client.close();
    },
  });
  await seedReference(db);
  await db.insert(user).values([
    {
      id: ownerId,
      name: "Owner",
      email: "owner@example.com",
      emailVerified: true,
      role: "owner",
    },
    {
      id: partnerId,
      name: "Partner",
      email: "partner@example.com",
      emailVerified: true,
      role: "member",
    },
  ]);
  await db.insert(athleteProfiles).values([
    {
      userId: ownerId,
      startDate: "2026-10-12",
      units: "lb",
      timezone: "UTC",
      hasBar: false,
      programId: "ct-12",
      programVersion: "1.0",
      visibility: "private",
      publicHandle: "owner-athlete",
      visibleSections: ["stats_charts", "level_history"],
      showName: false,
      showEmail: false,
    },
    {
      userId: partnerId,
      startDate: "2026-10-12",
      units: "kg",
      timezone: "UTC",
      hasBar: false,
      programId: "ct-12",
      programVersion: "1.0",
      visibility: "private",
      publicHandle: "partner-athlete",
    },
  ]);
  dal = createDal(db);
  const saved = await dal.saveSet({
    userId: ownerId,
    date: "2026-10-14",
    exerciseId: "SQ1",
    block: "A1",
    order: 1,
    setNumber: 1,
    value: 12,
    rir: 2,
    prescribedSets: 2,
    targetMin: 8,
    targetMax: 12,
  });
  if (!saved.ok) throw new Error(saved.error);
});

afterAll(async () => {
  await client.close();
});

describe("authorization", () => {
  it("does not let one user read or change another user's session", async () => {
    const [owned] = await dal.listSessions(ownerId);
    expect(owned).toBeTruthy();
    const stolen = await dal.ownedSession(partnerId, owned!.id);
    expect(stolen).toBeNull();
    const partnerSessions = await dal.listSessions(partnerId);
    expect(partnerSessions).toHaveLength(0);

    const [log] = await db.select().from(exerciseLogs);
    const denied = await dal.saveSet({
      userId: partnerId,
      date: "2026-10-14",
      exerciseId: "SQ1",
      block: "A1",
      order: 1,
      setNumber: 1,
      value: 1,
      rir: 0,
      prescribedSets: 2,
      targetMin: 8,
      targetMax: 12,
      exerciseLogId: log!.id,
    });
    expect(denied.ok).toBe(false);
    const sets = await db.select().from(setLogs);
    expect(sets.map((set) => set.value)).toEqual([12]);
    const setsForPartner = await dal.listSets(partnerId, log!.id);
    expect(setsForPartner).toBeNull();
  });

  it("hides private and missing handles behind the same response", async () => {
    const missing = await dal.getPublicProfile("does-not-exist");
    const privateProfile = await dal.getPublicProfile("owner-athlete");
    expect(missing).toEqual({ available: false });
    expect(privateProfile).toEqual(missing);
    expect(JSON.stringify(privateProfile)).not.toContain(ownerId);
    expect(JSON.stringify(privateProfile)).not.toContain("owner@example.com");
  });

  it("shows only the sections a public profile opted into", async () => {
    const published = await dal.setSharing({
      userId: ownerId,
      visibility: "public",
      sections: ["stats_charts", "level_history"],
      handle: "owner-athlete",
      showName: false,
      showEmail: false,
      allowIndexing: false,
    });
    expect(published.ok).toBe(true);
    const profile = await dal.getPublicProfile("owner-athlete");
    expect(profile.available).toBe(true);
    if (!profile.available) return;
    expect(profile.email).toBeNull();
    expect(profile.displayName).toBeNull();
    expect(profile.handle).toBe("owner-athlete");
    expect(profile.allowIndexing).toBe(false);
    expect(profile.stats).not.toBeNull();
    expect(profile.levels).not.toBeNull();
    expect(profile.logs).toBeNull();
    expect(JSON.stringify(profile)).not.toContain(ownerId);
    expect(JSON.stringify(profile)).not.toContain("owner@example.com");
  });

  it("lets a partner read a shared profile and stops when it goes private", async () => {
    await dal.setSharing({
      userId: ownerId,
      visibility: "partner",
      sections: ["stats_charts"],
      handle: "owner-athlete",
      showName: true,
      showEmail: true,
      allowIndexing: false,
    });
    const shared = await dal.getPartnerView(partnerId, ownerId);
    expect(shared.available).toBe(true);
    if (shared.available) {
      expect(shared.email).toBe("owner@example.com");
      expect(shared.displayName).toBe("Owner");
      expect(shared.stats).not.toBeNull();
      expect(shared.logs).toBeNull();
      expect(shared.levels).toBeNull();
    }
    const stranger = await dal.getPublicProfile("owner-athlete");
    expect(stranger).toEqual({ available: false });

    await dal.setSharing({
      userId: ownerId,
      visibility: "private",
      sections: ["stats_charts", "level_history"],
      handle: "owner-athlete",
      showName: false,
      showEmail: false,
      allowIndexing: false,
    });
    const after = await dal.getPartnerView(partnerId, ownerId);
    expect(after).toEqual({ available: false });
    const stillPrivate = await dal.getPublicProfile("owner-athlete");
    expect(stillPrivate).toEqual({ available: false });
  });

  it("refuses a write that is not tied to a user", async () => {
    const [session] = await db.select().from(workoutSessions);
    expect(await dal.ownedSession("", session!.id)).toBeNull();
  });
});
