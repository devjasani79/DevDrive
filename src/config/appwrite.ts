// src/config/appwrite.ts

export const APPWRITE_CONFIG = {
  DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  FILES_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID!,
  STORAGE_BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,

  MAX_FILE_SIZE: 50 * 1024 * 1024,
  MAX_TOTAL_STORAGE: 500 * 1024 * 1024,

  SUPPORTED_FILE_TYPES: {
    images: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ] as readonly string[],

    videos: [
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv',
    ] as readonly string[],

    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ] as readonly string[],
  },
};

/* ---------- Runtime validation ---------- */
(() => {
  const missing: string[] = [];

  if (!APPWRITE_CONFIG.DATABASE_ID) missing.push('DATABASE_ID');
  if (!APPWRITE_CONFIG.FILES_COLLECTION_ID) missing.push('FILES_COLLECTION_ID');
  if (!APPWRITE_CONFIG.STORAGE_BUCKET_ID) missing.push('STORAGE_BUCKET_ID');

  if (missing.length) {
    throw new Error(`❌ Missing Appwrite env vars: ${missing.join(', ')}`);
  }
})();

/* ---------- Helpers ---------- */

export type FileCategory = 'documents' | 'images' | 'videos' | 'others';

export function getFileCategory(mimeType?: string): FileCategory {
  if (!mimeType) return 'others';

  if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.documents.includes(mimeType))
    return 'documents';

  if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.images.includes(mimeType))
    return 'images';

  if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.videos.includes(mimeType))
    return 'videos';

  return 'others';
}
