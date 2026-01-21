// File and folder types
export interface FileItem {
  $id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size: number;
  parentId?: string;
  userId: string;
  bucketFileId?: string; // Appwrite storage file ID
  $createdAt: string;
  $updatedAt: string;
}

export interface StorageStats {
  totalFiles: number;
  totalSize: number;
  documents: { count: number; size: number };
  images: { count: number; size: number };
  videos: { count: number; size: number };
  others: { count: number; size: number };
}

export interface CreateFileData {
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size: number;
  parentId?: string;
  bucketFileId?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}
