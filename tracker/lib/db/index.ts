import { mkdirSync } from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite, type PgliteDatabase } from "drizzle-orm/pglite";
import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@/lib/env";

import * as schema from "./schema";

export type AppDatabase = PgliteDatabase<typeof schema> | PostgresJsDatabase<typeof schema>;

type Handle = {
  db: AppDatabase;
  exec: (statement: string) => Promise<void>;
  close: () => Promise<void>;
  kind: "pglite" | "postgres";
};

const globalStore = globalThis as unknown as { __trackerDb?: Handle };

function open(): Handle {
  const url = env().DATABASE_URL;
  if (url.startsWith("postgres://") || url.startsWith("postgresql://")) {
    const client = postgres(url, { max: 1 });
    const db = drizzlePg(client, { schema });
    return {
      db,
      kind: "postgres",
      exec: async (statement) => {
        await client.unsafe(statement);
      },
      close: async () => {
        await client.end();
      },
    };
  }
  const dir = url.replace(/^pglite:/, "") || "./.data/pglite";
  const absolute = path.resolve(/*turbopackIgnore: true*/ dir);
  mkdirSync(path.dirname(absolute), { recursive: true });
  const client = new PGlite(absolute);
  const db = drizzlePglite(client, { schema });
  return {
    db,
    kind: "pglite",
    exec: async (statement) => {
      await client.exec(statement);
    },
    close: async () => {
      await client.close();
    },
  };
}

export function getDatabase(): Handle {
  if (!globalStore.__trackerDb) globalStore.__trackerDb = open();
  return globalStore.__trackerDb;
}

export async function closeDatabase(): Promise<void> {
  if (!globalStore.__trackerDb) return;
  await globalStore.__trackerDb.close();
  globalStore.__trackerDb = undefined;
}
