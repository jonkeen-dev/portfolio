export type SetPayload = {
  date: string;
  exerciseId: string;
  block: string | null;
  order: number;
  setNumber: number;
  value: number;
  rir: number | null;
  prescribedSets: number;
  targetMin: number;
  targetMax: number;
  day: string | null;
  sessionType?: "workout" | "assessment" | "retest";
  clientId: string;
};

const DB_NAME = "ct-queue";
const STORE = "sets";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function enqueue(body: SetPayload): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).add(body);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function postSet(body: SetPayload): Promise<{ ok: true; queued?: boolean } | { ok: false; error: string }> {
  try {
    const response = await fetch("/api/sets", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      return { ok: false, error: payload?.error ?? "Could not save that set." };
    }
    return { ok: true };
  } catch {
    await enqueue(body);
    return { ok: true, queued: true };
  }
}

export async function flushQueue(): Promise<void> {
  const db = await openDb().catch(() => null);
  if (!db) return;
  const rows = await new Promise<Array<{ key: IDBValidKey; body: SetPayload }>>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const request = store.openCursor();
    const found: Array<{ key: IDBValidKey; body: SetPayload }> = [];
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      found.push({ key: cursor.key, body: cursor.value as SetPayload });
      cursor.continue();
    };
    tx.oncomplete = () => resolve(found);
    tx.onerror = () => reject(tx.error);
  });
  for (const row of rows) {
    try {
      const response = await fetch("/api/sets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row.body),
      });
      if (!response.ok) continue;
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE, "readwrite");
        tx.objectStore(STORE).delete(row.key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      break;
    }
  }
  db.close();
}

export function clientIdFor(date: string): string {
  const key = `ct-client:${date}`;
  const existing = sessionStorage.getItem(key);
  if (existing) return existing;
  const created = crypto.randomUUID();
  sessionStorage.setItem(key, created);
  return created;
}
