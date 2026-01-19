import { NextRequest, NextResponse } from "next/server";
import { createUserSession } from "@/server/auth";
import { cookies } from "next/headers";
import { cookieSettinigs } from "@/lib/cookieSettings";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const result = await createUserSession(email, password);
    if (!result.success || !result.session) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set session cookie
    (await cookies()).set(
      "session",
      result.session.secret,
      cookieSettinigs as object
    );

    return NextResponse.json({
      message: "Login successful",
      session: result.session,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
