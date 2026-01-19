import { useState, useEffect, useCallback } from 'react';
import { fileService } from '@/services/fileService';
import { FileItem, StorageStats, UploadProgress } from '@/types/files';

// Hook for fetching user files
export const useUserFiles = (userId: string, parentId?: string) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const userFiles = await fileService.getUserFiles(userId, parentId);
      setFiles(userFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch files');
    } finally {
      setLoading(false);
    }
  }, [userId, parentId]);

  useEffect(() => {
    if (userId) {
      fetchFiles();
    }
  }, [userId, fetchFiles]);

  return { files, loading, error, refetch: fetchFiles };
};

// Hook for fetching recent files
export const useRecentFiles = (userId: string) => {
  const [recentFiles, setRecentFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecentFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const files = await fileService.getRecentFiles(userId);
      setRecentFiles(files);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent files');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchRecentFiles();
    }
  }, [userId, fetchRecentFiles]);

  return { recentFiles, loading, error, refetch: fetchRecentFiles };
};

// Hook for fetching storage statistics
export const useStorageStats = (userId: string) => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const storageStats = await fileService.getStorageStats(userId);
      setStats(storageStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch storage stats');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchStats();
    }
  }, [userId, fetchStats]);

  return { stats, loading, error, refetch: fetchStats };
};

// Hook for fetching all folders (for move functionality)
export const useAllFolders = (userId: string) => {
  const [folders, setFolders] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFolders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allFolders = await fileService.getAllFolders(userId);
      setFolders(allFolders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch folders');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchFolders();
    }
  }, [userId, fetchFolders]);

  return { folders, loading, error, refetch: fetchFolders };
};

// Hook for file upload
export const useFileUpload = () => {
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFiles = async (files: File[], userId: string, parentId?: string) => {
    setIsUploading(true);
    const newProgress: UploadProgress[] = files.map(file => ({
      fileId: Math.random().toString(36).substr(2, 9),
      fileName: file.name,
      progress: 0,
      status: 'uploading'
    }));

    setUploadProgress(newProgress);

    const results = await Promise.allSettled(
      files.map(async (file, index) => {
        try {
          const result = await fileService.uploadFile(file, userId, parentId);
          
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index 
                ? { ...item, progress: 100, status: 'completed' as const }
                : item
            )
          );
          
          return result;
        } catch (error) {
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index 
                ? { 
                    ...item, 
                    status: 'error' as const, 
                    error: error instanceof Error ? error.message : 'Upload failed' 
                  }
                : item
            )
          );
          throw error;
        }
      })
    );

    setIsUploading(false);
    return results;
  };

  const clearProgress = () => {
    setUploadProgress([]);
  };

  return {
    uploadFiles,
    uploadProgress,
    isUploading,
    clearProgress
  };
};

// Hook for folder creation
export const useCreateFolder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFolder = async (name: string, userId: string, parentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const folder = await fileService.createFolder(name, userId, parentId);
      return folder;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { createFolder, loading, error };
};

// Hook for file operations (delete, open)
export const useFileOperations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteFile = async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);
      await fileService.deleteFile(fileId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openFile = (file: FileItem) => {
    if (file.type === 'folder') {
      // For folders, we would navigate to that folder
      // This will be handled by the component
      return;
    }

    if (file.bucketFileId) {
      // For files, get the view URL and open in new tab (doesn't trigger download)
      const viewUrl = fileService.getFileView(file.bucketFileId);
      window.open(viewUrl, '_blank');
    }
  };

  const moveFile = async (fileId: string, newParentId?: string) => {
    try {
      setLoading(true);
      setError(null);
      await fileService.moveFile(fileId, newParentId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getFileViewUrl = (bucketFileId: string) => {
    return fileService.getFileView(bucketFileId);
  };

  const getFileDownloadUrl = (bucketFileId: string) => {
    return fileService.getFileDownload(bucketFileId);
  };

  return {
    deleteFile,
    moveFile,
    openFile,
    getFileViewUrl,
    getFileDownloadUrl,
    loading,
    error
  };
};
