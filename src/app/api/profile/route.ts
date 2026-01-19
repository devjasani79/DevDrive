import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/auth";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const sessionCookie = (await cookies()).get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const result = await getCurrentUser(sessionCookie.value);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    return NextResponse.json({ user: result.user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const sessionCookie = (await cookies()).get("session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { name, password } = await request.json();

    // Get current user first to verify session
    const currentUserResult = await getCurrentUser(sessionCookie.value);
    if (!currentUserResult.success) {
      return NextResponse.json({ error: currentUserResult.error }, { status: 401 });
    }

    // Update user profile
    const { updateUserProfile } = await import("@/server/auth");
    const result = await updateUserProfile(sessionCookie.value, name, password);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      user: result.user 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
