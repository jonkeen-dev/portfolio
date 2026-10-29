import { closeDatabase, getDatabase } from "@/lib/db";
import { migrate } from "@/lib/db/migrate";

import { seedReference } from "./seed-lib";

async function main() {
  await migrate();
  await seedReference(getDatabase().db);
  console.log("reference data seeded");
  await closeDatabase();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});