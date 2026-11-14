import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const redirectPath = searchParams.get("redirect") || "/";

  const draft = await draftMode();
  draft.disable();

  const redirectUrl = new URL(redirectPath, request.url);
  return NextResponse.redirect(redirectUrl);
}

