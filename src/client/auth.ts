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

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { success: false, error: data.error || "Registration failed" };
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

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const response = await fetch("/api/signin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        return { success: false, error: data.error || "Login failed" };
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

export async function logoutUser(): Promise<AuthResponse> {
  try {
    const { account } = await import("@/lib/appwrite");
    await account.deleteSession("current");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Logout failed" };
  }
}

export async function getCurrentUser(): Promise<AuthResponse> {
  try {
    const { account } = await import("@/lib/appwrite");
    const user = await account.get();
    return { success: true, data: { user } };
  } catch {
    return { success: false, error: "No active session" };
  }
}

export async function initiateGoogleAuth(): Promise<void> {
  try {
    const { account, OAuthProvider } = await import("@/lib/appwrite");

    const origin = window.location.origin;

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
