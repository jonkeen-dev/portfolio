import { closeDatabase } from "@/lib/db";
import { migrate } from "@/lib/db/migrate";

async function main() {
  const ran = await migrate();
  console.log(ran.length ? `applied ${ran.join(", ")}` : "migrations already applied");
  await closeDatabase();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
