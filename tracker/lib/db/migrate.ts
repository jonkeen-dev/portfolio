import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

import { sql } from "drizzle-orm";

import { getDatabase } from "./index";

function statementsOf(file: string): string[] {
  return file
    .split("--> statement-breakpoint")
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
}

export async function migrate(handle = getDatabase()): Promise<string[]> {
  const applied = new Set<string>();
  try {
    const result = await handle.db.execute(sql`select id from schema_migrations`);
    const rows = Array.isArray(result) ? result : ((result as unknown as { rows?: { id: string }[] }).rows ?? []);
    for (const row of rows) applied.add(String((row as { id: string }).id));
  } catch {
    applied.clear();
  }

  const folder = path.join(process.cwd(), "drizzle");
  const files = readdirSync(folder)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const ran: string[] = [];
  for (const file of files) {
    const id = file.replace(/\.sql$/, "");
    if (applied.has(id)) continue;
    const body = readFileSync(path.join(folder, file), "utf8");
    await handle.exec("begin");
    try {
      for (const statement of statementsOf(body)) {
        await handle.exec(statement);
      }
      await handle.exec(`insert into schema_migrations (id) values ('${id.replace(/'/g, "")}')`);
      await handle.exec("commit");
      ran.push(id);
    } catch (error) {
      await handle.exec("rollback");
      throw error;
    }
  }
  return ran;
}
