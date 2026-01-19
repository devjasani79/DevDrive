// Configuration constants for Appwrite
export const APPWRITE_CONFIG = {
  // TODO: Replace these with your actual Appwrite IDs
  DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || 'your-database-id',
  FILES_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID || 'your-files-collection-id',
  STORAGE_BUCKET_ID: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID || 'your-storage-bucket-id',
  
  // Storage limits
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per file
  MAX_TOTAL_STORAGE: 500 * 1024 * 1024, // 500MB total per user
  
  // Supported file types
  SUPPORTED_FILE_TYPES: {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    videos: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ]
  }
};

export const getFileCategory = (mimeType: string): 'documents' | 'images' | 'videos' | 'others' => {
  if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.documents.includes(mimeType)) {
    return 'documents';
  }
  if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.images.includes(mimeType)) {
    return 'images';
  }
  if (APPWRITE_CONFIG.SUPPORTED_FILE_TYPES.videos.includes(mimeType)) {
    return 'videos';
  }
  return 'others';
};
