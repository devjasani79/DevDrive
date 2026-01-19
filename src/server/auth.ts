import { adminAccount, sessionAccount, users } from './config';
import { ID, OAuthProvider } from 'node-appwrite';

export async function createUserSession(email: string, password: string) {
  try {
    const session = await adminAccount.createEmailPasswordSession(email, password);
    return { success: true, session };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while signin",
    };
  }
}

export async function createUser(
  email: string,
  password: string,
  name?: string
) {
  try {
    const user = await users.create(
      ID.unique(),
      email,
      undefined,
      password,
      name
    );
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating user",
    };
  }
}

export async function getCurrentUser(sessionId: string) {
  try {
    sessionAccount.client.setSession(sessionId);
    const user = await sessionAccount.get();
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while getting the user",
    };
  }
}

export async function createGoogleOAuthSession(successUrl: string, failureUrl: string) {
  try {
    const redirectUrl = await adminAccount.createOAuth2Token(
      OAuthProvider.Google,
      successUrl,
      failureUrl
    );
    return { success: true, redirectUrl };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while creating Google OAuth session",
    };
  }
}

export async function deleteCurrentSession(sessionId: string) {
  try {
    sessionAccount.client.setSession(sessionId);
    await sessionAccount.deleteSession("current");
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while signout",
    };
  }
}

export async function updateUserProfile(sessionId: string, name?: string, password?: string) {
  try {
    sessionAccount.client.setSession(sessionId);
    
    // Update name if provided
    if (name) {
      await sessionAccount.updateName(name);
    }
    
    // Update password if provided
    if (password) {
      await sessionAccount.updatePassword(password);
    }
    
    // Get the updated user info
    const user = await sessionAccount.get();
    
    return { success: true, user };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while updating profile",
    };
  }
}
