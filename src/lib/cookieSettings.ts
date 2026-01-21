// This file is kept for reference but is no longer actively used
// Appwrite now manages cookies automatically with the a_session_<PROJECT_ID> format

export const getSessionCookieName = () => {
  return `a_session_${process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID}`;
};

// These settings match Appwrite's default cookie configuration
export const cookieSettings = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};
