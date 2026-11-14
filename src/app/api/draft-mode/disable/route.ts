import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { safeInternalRedirectPath } from "../enable/route";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const rawRedirect = searchParams.get("redirect");

  const safePath = safeInternalRedirectPath(rawRedirect, request.url);

  const draft = await draftMode();
  draft.disable();

  const redirectUrl = new URL(safePath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, max-age=0"
  );
  response.headers.set("Pragma", "no-cache");

  return response;
}
