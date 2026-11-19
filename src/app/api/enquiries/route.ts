import { NextRequest, NextResponse } from "next/server";
import { submitEnquiryAction } from "@/server/actions/enquiry.actions";
import type { ApiResponse } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const result = await submitEnquiryAction(body);

    if (!result.success) {
      if (result.error?.includes("limit reached")) {
        const response: ApiResponse = {
          success: false,
          error: {
            code: "RATE_LIMITED",
            message: result.error,
          },
        };
        return NextResponse.json(response, { status: 429 });
      }

      const unavailable = result.error?.includes("database service interruption") ?? false;
      const response: ApiResponse = {
        success: false,
        error: {
          code: unavailable ? "SERVICE_UNAVAILABLE" : result.errors ? "VALIDATION_ERROR" : "SUBMISSION_REJECTED",
          message: result.error || "Submission failed.",
          details: result.errors,
        },
      };
      return NextResponse.json(response, { status: unavailable ? 503 : 400 });
    }

    const response: ApiResponse<{ enquiryId: string; message: string }> = {
      success: true,
      data: {
        enquiryId: result.enquiryId || "enq_unknown",
        message: "Your project enquiry has been successfully registered.",
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Malformed request";
    console.error("[api.enquiries] Request handler error:", msg);

    const response: ApiResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Unable to process your request at this time.",
      },
    };
    return NextResponse.json(response, { status: 500 });
  }
}
