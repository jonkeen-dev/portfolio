import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";
import { observePasskeyRegistrationResponse } from "@/lib/passkey-errors";

const handler = toNextJsHandler(auth);

export function GET(request: Request) {
  return handler.GET(request).then((response) => observePasskeyRegistrationResponse(request, response));
}

export function POST(request: Request) {
  return handler.POST(request).then((response) => observePasskeyRegistrationResponse(request, response));
}
