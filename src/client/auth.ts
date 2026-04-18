import type { Models } from "appwrite";

interface AuthResponse {
  success: boolean;
  data?: {
    message?: string;
    session?: {
      $id: string;
      $createdAt: string;
      $updatedAt: string;
      userId: string;
      expire: string;
    };
    user?: Models.User<Models.Preferences>; // Appwrite user object
    $id?: string;
    email?: string;
    name?: string;
  };
  error?: string;
}

async function waitForCurrentUser(account: any, maxAttempts = 10, delayMs = 1000) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const user = await account.get();
      return { success: true, data: { user } };
    } catch (error) {
      lastError = error;
      console.log(`waitForCurrentUser attempt ${attempt}/${maxAttempts} failed:`, error);
      if (attempt < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.warn("waitForCurrentUser: failed after retries", lastError);
  return { success: false };
}

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  try {
    const { account } = await import("@/lib/appwrite");
    const { ID } = await import("appwrite");
    
    // Delete any existing session to avoid conflicts
    try {
      await account.deleteSession("current");
    } catch {
      // No active session, continue
    }
    
    // Create user account
    await account.create(ID.unique(), email, password, name);
    
    // Create session (this automatically sets the a_session_<PROJECT_ID> cookie)
    const session = await account.createEmailPasswordSession(email, password);
    
    // Wait for Appwrite to establish the session before returning user data
    const currentUser = await waitForCurrentUser(account);
    if (!currentUser.success) {
      throw new Error("Unable to verify user session after registration");
    }
    
    return { 
      success: true, 
      data: { 
        session: session as any,
        user: currentUser.data?.user,
        message: "Registration successful" 
      } 
    };
  } catch (error) {
    console.error("Registration error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Registration failed" 
    };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { account } = await import("@/lib/appwrite");
    
    // Delete any existing session to avoid conflicts
    try {
      await account.deleteSession("current");
    } catch {
      // No active session, continue
    }
    
    // Create session (this automatically sets the a_session_<PROJECT_ID> cookie)
    const session = await account.createEmailPasswordSession(email, password);
    
    // Wait for Appwrite to establish the session before returning user data
    const currentUser = await waitForCurrentUser(account);
    if (!currentUser.success) {
      throw new Error("Unable to verify user session after login");
    }
    
    return { 
      success: true, 
      data: { 
        session: session as any,
        user: currentUser.data?.user,
        message: "Login successful" 
      } 
    };
  } catch (error) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Login failed" 
    };
  }
}

export async function logoutUser(): Promise<AuthResponse> {
  try {
    const { account } = await import("@/lib/appwrite");
    
    // Delete current session (this automatically removes the cookie)
    await account.deleteSession("current");
    
    return { success: true, data: { message: "Logout successful" } };
  } catch (error) {
    console.error("Logout error:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Logout failed" 
    };
  }
}

export async function getCurrentUser() {
  try {
    const { account } = await import("@/lib/appwrite");
    return await waitForCurrentUser(account, 10, 1000);
  } catch (error) {
    console.error("getCurrentUser error:", error);
    return { success: false };
  }
}

export async function initiateGoogleAuth(): Promise<void> {
  try {
    const { account, OAuthProvider } = await import("@/lib/appwrite");

    const origin = window.location.origin;

    // Check if there's an active session and delete it to avoid conflicts
    try {
      await account.get(); // This will throw if no session
      await account.deleteSession("current"); // Delete current session
    } catch {
      // No active session, continue
    }

    await account.createOAuth2Session(
      OAuthProvider.Google,
      `${origin}/auth/oauth-success`,
      `${origin}/signin?error=oauth_failed`
    );
  } catch (error) {
    console.error("Failed to initiate Google authentication:", error);
    throw new Error("Failed to initiate Google authentication");
  }
}

export async function updateUserProfile(
  name?: string,
  password?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { success: false, error: data.error || "Profile update failed" };
      } else {
        return { success: false, error: "Server error" };
      }
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Network error" };
  }
}
