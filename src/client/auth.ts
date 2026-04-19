import type { Models } from 'appwrite';

interface AuthResponse {
  success: boolean;
  data?: {
    message?: string;
    user?: Models.User<Models.Preferences>;
  };
  error?: string;
}

// ─── EMAIL / PASSWORD AUTH ───────────────────────────────────────────────────

export async function registerUser(
  email: string,
  password: string,
  name?: string
): Promise<AuthResponse> {
  try {
    const { account } = await import('@/lib/appwrite');
    const { ID } = await import('appwrite');

    // Clear any existing session silently
    try { await account.deleteSession('current'); } catch { /* none */ }

    // Create account
    await account.create(ID.unique(), email, password, name);

    // Create session — Appwrite sets the cookie automatically
    await account.createEmailPasswordSession(email, password);

    // Verify it worked — one direct call, no retries needed
    const user = await account.get();
    return { success: true, data: { user, message: 'Registration successful' } };
  } catch (error) {
    console.error('[registerUser]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const { account } = await import('@/lib/appwrite');

    // Clear any existing session silently
    try { await account.deleteSession('current'); } catch { /* none */ }

    // Create session — Appwrite sets the cookie automatically
    await account.createEmailPasswordSession(email, password);

    // Verify — one direct call
    const user = await account.get();
    return { success: true, data: { user, message: 'Login successful' } };
  } catch (error) {
    console.error('[loginUser]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

export async function logoutUser(): Promise<AuthResponse> {
  try {
    const { account } = await import('@/lib/appwrite');
    await account.deleteSession('current');
    return { success: true, data: { message: 'Logout successful' } };
  } catch (error) {
    console.error('[logoutUser]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
// Used by AuthContext on page load. Retries a few times because the cookie
// might need a moment to be available on first render.

export async function getCurrentUser(): Promise<{
  success: boolean;
  data?: { user: Models.User<Models.Preferences> };
}> {
  const { account } = await import('@/lib/appwrite');

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const user = await account.get();
      return { success: true, data: { user } };
    } catch {
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, 300 * attempt));
      }
    }
  }
  return { success: false };
}

// ─── GOOGLE OAUTH ────────────────────────────────────────────────────────────
// This uses the Appwrite client SDK directly — the simplest and most reliable
// approach. Appwrite handles the full OAuth flow and sets the session cookie.

export async function initiateGoogleAuth(): Promise<void> {
  const { account, OAuthProvider } = await import('@/lib/appwrite');
  const origin = window.location.origin;

  // Clear any existing session first
  try { await account.deleteSession('current'); } catch { /* none */ }

  // This redirects the browser to Google → back to Appwrite → back to your app
  // Appwrite sets the session cookie BEFORE redirecting to successUrl
  await account.createOAuth2Session(
    OAuthProvider.Google,
    `${origin}/auth/oauth-success`,   // Appwrite redirects here after success
    `${origin}/signin?error=oauth_failed`  // Appwrite redirects here on failure
  );
}

// ─── PROFILE UPDATE ──────────────────────────────────────────────────────────

export async function updateUserProfile(
  name?: string,
  password?: string
): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Profile update failed' };
    }

    return { success: true, data };
  } catch (error) {
    console.error('[updateUserProfile]', error);
    return { success: false, error: 'Network error' };
  }
}