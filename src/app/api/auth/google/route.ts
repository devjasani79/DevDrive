import { NextRequest, NextResponse } from "next/server";
import { createGoogleOAuthSession } from "@/server/auth";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const successUrl = searchParams.get('successUrl') || `${request.nextUrl.origin}/auth/callback`;
    const failureUrl = searchParams.get('failureUrl') || `${request.nextUrl.origin}/signin?error=oauth_failed`;

    const result = await createGoogleOAuthSession(successUrl, failureUrl);
    
    if (!result.success || !result.redirectUrl) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.redirect(result.redirectUrl);
  } catch (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.json({ error: "Failed to initiate Google OAuth" }, { status: 500 });
  }
}
