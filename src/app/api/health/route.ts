import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export async function GET() {
  const healthData = {
    service: "VOIDTECH SOLUTION API",
    status: "healthy",
    version: "0.1.0",
    milestone: "Phase 1: Foundation",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || "development",
  };

  const response: ApiResponse<typeof healthData> = {
    success: true,
    data: healthData,
    meta: {
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(response, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

