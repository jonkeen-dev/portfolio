import { rmSync } from "node:fs";

import { closeDatabase, getDatabase } from "@/lib/db";
import { migrate } from "@/lib/db/migrate";

import { seedReference } from "./seed-lib";

async function main() {
  rmSync(".data/e2e", { recursive: true, force: true });
  rmSync(".data/mailbox.json", { force: true });
  rmSync(".data/indexable.json", { force: true });
  process.env.DATABASE_URL = process.env.DATABASE_URL ?? "pglite:./.data/e2e";
  await migrate();
  await seedReference(getDatabase().db);
  await closeDatabase();
  console.log("e2e database ready");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
