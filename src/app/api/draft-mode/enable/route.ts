import { draftMode } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const redirectPath = searchParams.get("redirect") || "/";

  const expectedSecret =
    process.env.DRAFT_MODE_SECRET || "voidtech_draft_preview_secret_2026";

  if (secret !== expectedSecret) {
    return NextResponse.json(
      {
        error: "Unauthorized: Invalid or missing draft mode secret token.",
        code: "INVALID_PREVIEW_SECRET",
      },
      { status: 401 }
    );
  }

  // Activate Next.js Draft Mode
  const draft = await draftMode();
  draft.enable();

  const redirectUrl = new URL(redirectPath, request.url);
  const response = NextResponse.redirect(redirectUrl);

  // Mandatory indexing prevention header
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

