/**
 * Environment Variable Validation
 * Ensures all required env vars are set at runtime
 */

const env = {
  appwrite: {
    endpoint: String(process.env.NEXT_PUBLIC_APPWRITE_HOST_URL),
    projectId: String(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID),
    apikey: String(process.env.APPWRITE_API_KEY),
    databaseId: String(process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID),
    collectionId: String(process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID),
    bucketId: String(process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID),
  },
  app: {
    url: String(process.env.NEXT_PUBLIC_APP_URL || 'https://googledev-drive.vercel.app'),
    env: String(process.env.NODE_ENV || 'development'),
  },
  auth: {
    googleClientId: String(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID),
    shareSecret: String(process.env.SHARE_SECRET),
  },
  email: {
    gmailUser: String(process.env.GMAIL_USER || ''),
    gmailPassword: String(process.env.GMAIL_APP_PASSWORD || ''),
  },
  ai: {
    groqApiKey: String(process.env.GROQ_API_KEY || ''),
    geminiApiKey: String(process.env.GEMINI_API_KEY || ''),
  },
};

// Validate critical env vars only in production OR if running client-side bundle
if (typeof window === 'undefined' || env.app.env === 'production') {
  const required = [
    'NEXT_PUBLIC_APPWRITE_HOST_URL',
    'NEXT_PUBLIC_APPWRITE_PROJECT_ID',
    'NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing critical environment variables: ${missing.join(', ')}`
    );
  }
}
  
export default env;