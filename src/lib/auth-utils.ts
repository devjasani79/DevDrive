export const OAUTH_PROVIDERS = {
  GOOGLE: "google",
} as const;

export const OAUTH_ERRORS = {
  FAILED: "oauth_failed",
  INVALID_RESPONSE: "invalid_oauth_response",
  CALLBACK_FAILED: "oauth_callback_failed",
} as const;

export const ERROR_MESSAGES = {
  [OAUTH_ERRORS.FAILED]: "Google authentication failed. Please try again.",
  [OAUTH_ERRORS.INVALID_RESPONSE]:
    "Invalid authentication response. Please try again.",
  [OAUTH_ERRORS.CALLBACK_FAILED]:
    "Authentication callback failed. Please try again.",
  DEFAULT: "Authentication failed. Please try again.",
} as const;

export function getOAuthErrorMessage(error: string): string {
  return (
    ERROR_MESSAGES[error as keyof typeof ERROR_MESSAGES] ||
    ERROR_MESSAGES.DEFAULT
  );
}

export function generateOAuthUrls(baseUrl: string) {
  return {
    successUrl: `${baseUrl}/auth/callback`,
    failureUrl: `${baseUrl}/signin?error=${OAUTH_ERRORS.FAILED}`,
  };
}

export function isOAuthSupported(): boolean {
  return typeof window !== "undefined";
}
