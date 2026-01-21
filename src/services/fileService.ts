// src/server/services/fileService.ts

import { Databases, Storage, Query, Permission, Role } from 'appwrite';
import client, { account } from '@/lib/appwrite';
import { APPWRITE_CONFIG, getFileCategory } from '@/config/appwrite';
import { FileItem, CreateFileData, StorageStats } from '@/types/files';

class FileService {
  private databases: Databases;
  private storage: Storage;

  constructor() {
    this.databases = new Databases(client);
    this.storage = new Storage(client);

    // Log once at boot (debug-safe)
    console.log('[Appwrite]', {
      db: APPWRITE_CONFIG.DATABASE_ID,
      collection: APPWRITE_CONFIG.FILES_COLLECTION_ID,
      bucket: APPWRITE_CONFIG.STORAGE_BUCKET_ID,
    });
  }

  /* ---------------- AUTH ---------------- */

  private async ensureAuthenticated(): Promise<void> {
    try {
      await account.get();
    } catch {
      throw new Error('User not authenticated');
    }
  }

  /* ---------------- READ ---------------- */

  async getUserFiles(userId: string, parentId?: string): Promise<FileItem[]> {
    await this.ensureAuthenticated();

    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('$updatedAt'),
      parentId
        ? Query.equal('parentId', parentId)
        : Query.isNull('parentId'),
    ];

    const res = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      queries
    );

    return res.documents as unknown as FileItem[];
  }

  async getAllFolders(userId: string): Promise<FileItem[]> {
    await this.ensureAuthenticated();

    const res = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('type', 'folder'),
        Query.orderAsc('name'),
      ]
    );

    return res.documents as unknown as FileItem[];
  }

  async getRecentFiles(userId: string): Promise<FileItem[]> {
    await this.ensureAuthenticated();

    const res = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('type', 'file'),
        Query.orderDesc('$updatedAt'),
        Query.limit(10),
      ]
    );

    return res.documents as unknown as FileItem[];
  }

  async getStorageStats(userId: string): Promise<StorageStats> {
    await this.ensureAuthenticated();

    const res = await this.databases.listDocuments(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      [
        Query.equal('userId', userId),
        Query.equal('type', 'file'),
        Query.limit(1000),
      ]
    );

    const files = res.documents as unknown as FileItem[];

    const stats: StorageStats = {
      totalFiles: files.length,
      totalSize: 0,
      documents: { count: 0, size: 0 },
      images: { count: 0, size: 0 },
      videos: { count: 0, size: 0 },
      others: { count: 0, size: 0 },
    };

    for (const file of files) {
      stats.totalSize += file.size;
      const category = getFileCategory(file.mimeType);
      stats[category].count++;
      stats[category].size += file.size;
    }

    return stats;
  }

  /* ---------------- WRITE ---------------- */

  async createFile(data: CreateFileData, userId: string): Promise<FileItem> {
    const res = await this.databases.createDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      'unique()',
      { ...data, userId },
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    );

    return res as unknown as FileItem;
  }

  async createFolder(
    name: string,
    userId: string,
    parentId?: string
  ): Promise<FileItem> {
    return this.createFile(
      { name, type: 'folder', size: 0, parentId },
      userId
    );
  }

  async uploadFile(
    file: File,
    userId: string,
    parentId?: string
  ): Promise<FileItem> {
    await this.ensureAuthenticated();

    if (file.size > APPWRITE_CONFIG.MAX_FILE_SIZE) {
      throw new Error('File exceeds 50MB limit');
    }

    const stats = await this.getStorageStats(userId);
    if (stats.totalSize + file.size > APPWRITE_CONFIG.MAX_TOTAL_STORAGE) {
      throw new Error('Storage quota exceeded');
    }

    const uploaded = await this.storage.createFile(
      APPWRITE_CONFIG.STORAGE_BUCKET_ID,
      'unique()',
      file
    );

    return this.createFile(
      {
        name: file.name,
        type: 'file',
        mimeType: file.type,
        size: file.size,
        parentId,
        bucketFileId: uploaded.$id,
      },
      userId
    );
  }

  async deleteFile(fileId: string): Promise<void> {
    const file = (await this.databases.getDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      fileId
    )) as unknown as FileItem;

    if (file.type === 'file' && file.bucketFileId) {
      await this.storage.deleteFile(
        APPWRITE_CONFIG.STORAGE_BUCKET_ID,
        file.bucketFileId
      );
    }

    await this.databases.deleteDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      fileId
    );
  }

  async moveFile(fileId: string, newParentId?: string): Promise<FileItem> {
    await this.ensureAuthenticated();

    const res = await this.databases.updateDocument(
      APPWRITE_CONFIG.DATABASE_ID,
      APPWRITE_CONFIG.FILES_COLLECTION_ID,
      fileId,
      { parentId: newParentId ?? null }
    );

    return res as unknown as FileItem;
  }

  /* ---------------- URL HELPERS ---------------- */

  getFileView(bucketFileId: string): string {
    return this.storage
      .getFileView(APPWRITE_CONFIG.STORAGE_BUCKET_ID, bucketFileId)
      .toString();
  }

  getFileDownload(bucketFileId: string): string {
    return this.storage
      .getFileDownload(APPWRITE_CONFIG.STORAGE_BUCKET_ID, bucketFileId)
      .toString();
  }
}

export const fileService = new FileService();
