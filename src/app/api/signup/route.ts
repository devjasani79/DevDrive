import { NextRequest, NextResponse } from "next/server";
import { createUser, createUserSession } from "@/server/auth";
import { cookies } from "next/headers";
import { cookieSettinigs } from "@/lib/cookieSettings";

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    // Create user
    const userResult = await createUser(email, password, name);
    if (!userResult.success) {
      return NextResponse.json({ error: userResult.error }, { status: 400 });
    }

    // Create session for the new user
    const sessionResult = await createUserSession(email, password);
    if (!sessionResult.success || !sessionResult.session) {
      return NextResponse.json({ error: sessionResult.error }, { status: 400 });
    }

    // Set session cookie
    (await cookies()).set(
      "session",
      sessionResult.session.secret,
      cookieSettinigs as object
    );

    return NextResponse.json({
      message: "User registered successfully",
      user: userResult.user,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
