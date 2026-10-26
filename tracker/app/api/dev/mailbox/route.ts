import { readMailbox } from "@/lib/email";
import { devMailboxEnabled } from "@/lib/env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  if (!devMailboxEnabled()) return new Response("Not found", { status: 404 });
  return Response.json({ messages: readMailbox() });
}
