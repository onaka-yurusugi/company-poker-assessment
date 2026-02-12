import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export const successResponse = <T>(data: T, status = 200): NextResponse<ApiResponse<T>> =>
  NextResponse.json({ success: true, data }, { status });

export const errorResponse = (error: string, status = 400): NextResponse<ApiResponse<never>> =>
  NextResponse.json({ success: false, error }, { status });
