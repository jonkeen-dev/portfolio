import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export type IndexableFile = { handles: string[]; indexable: string[] };

function filePath(): string {
  return path.join(process.cwd(), ".data", "indexable.json");
}

export function readIndexableFile(): IndexableFile {
  try {
    const parsed = JSON.parse(readFileSync(filePath(), "utf8")) as Partial<IndexableFile>;
    return { handles: parsed.handles ?? [], indexable: parsed.indexable ?? [] };
  } catch {
    return { handles: [], indexable: [] };
  }
}

export function writeIndexableFile(data: IndexableFile): void {
  const file = filePath();
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(data, null, 2));
}

export function handleAllowsIndexing(handle: string): boolean {
  return readIndexableFile().indexable.includes(handle.toLowerCase());
}
