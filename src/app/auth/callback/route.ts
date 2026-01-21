import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    return NextResponse.redirect(`${request.nextUrl.origin}/dashboard`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(
      `${request.nextUrl.origin}/signin?error=oauth_callback_failed`
    );
  }
}
