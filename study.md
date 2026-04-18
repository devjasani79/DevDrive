# GoogleDevDrive: Reverse Engineering the Build Process

This document reverse-engineers the Google Drive clone project as if I built it from scratch. It follows the chronological development history, including all iterations, decisions, and modifications. Think of it as the commit history and thought process behind each feature.

---

## Phase 1: Project Initialization & Foundation

### Step 1: Next.js Project Setup
First, I initialized a new Next.js project with TypeScript and App Router:

```bash
npx create-next-app@latest google-drive-clone --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd google-drive-clone
```

**Why App Router?** Latest Next.js features, built-in API routes, better performance with streaming and server components.

### Step 2: Core Dependencies Installation
Added essential packages for the tech stack:

```bash
npm install @appwrite/appwrite node-appwrite
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-navigation-menu @radix-ui/react-avatar @radix-ui/react-progress @radix-ui/react-separator @radix-ui/react-sheet @radix-ui/react-toast
npm install lucide-react heroicons @tailwindcss/forms tailwind-merge class-variance-authority clsx
npm install sonner
```

**Why these?**
- Appwrite SDKs for backend integration
- Radix UI for accessible, unstyled components (shadcn/ui foundation)
- Lucide/Heroicons for consistent iconography
- Tailwind utilities for styling
- Sonner for toast notifications

### Step 3: Project Structure Setup
Created the initial folder structure:

```
src/
├── app/
├── components/
├── lib/
├── config/
├── types/
├── utils/
└── contexts/
```

**Decision:** Organized by feature (app router), shared code (lib), configuration (config), types, utilities, and global state (contexts).

### Step 4: Environment Configuration
Created `src/env.ts` for environment variable validation:

```typescript
import { z } from 'zod'

export const envSchema = z.object({
  NEXT_PUBLIC_APPWRITE_ENDPOINT: z.string().url(),
  NEXT_PUBLIC_APPWRITE_PROJECT_ID: z.string(),
  NEXT_PUBLIC_APPWRITE_DATABASE_ID: z.string(),
  NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID: z.string(),
  NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID: z.string(),
  APPWRITE_API_KEY: z.string(),
})

export const env = envSchema.parse(process.env)
```

**Why?** Type-safe environment variables prevent runtime errors from missing configs.

---

## Phase 2: Appwrite Backend Setup

### Step 5: Appwrite Configuration
Set up the core Appwrite client configuration in `src/config/appwrite.ts`:

```typescript
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  filesCollectionId: process.env.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID!,
  storageBucketId: process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!,
  apiKey: process.env.APPWRITE_API_KEY!,
}

export const FILE_LIMITS = {
  maxFileSize: 50 * 1024 * 1024, // 50MB
  maxTotalStorage: 500 * 1024 * 1024, // 500MB
}

export const SUPPORTED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/avi', 'video/quicktime'],
  documents: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'text/csv'],
}
```

**Why centralized config?** Easy to modify limits and supported types without hunting through code.

### Step 6: Single Appwrite Client Instance
Created the critical `src/lib/appwrite.ts` file:

```typescript
import { Client, Account, Databases, Storage } from 'appwrite'

const client = new Client()
  .setEndpoint(APPWRITE_CONFIG.endpoint)
  .setProject(APPWRITE_CONFIG.projectId)

export const account = new Account(client)
export const databases = new Databases(client)
export const storage = new Storage(client)

export { client }
```

**Critical Decision:** Single client instance prevents session desynchronization. This was a major pain point I solved early - multiple clients cause auth conflicts.

### Step 7: Server-Side Appwrite Clients
Created `src/server/config.ts` for admin operations:

```typescript
import { Client, Account, Databases, Storage } from 'node-appwrite'

export const createAdminClient = () => {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setKey(APPWRITE_CONFIG.apiKey)

  return {
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  }
}

export const createSessionClient = (session: string) => {
  const client = new Client()
    .setEndpoint(APPWRITE_CONFIG.endpoint)
    .setProject(APPWRITE_CONFIG.projectId)
    .setSession(session)

  return {
    account: new Account(client),
    databases: new Databases(client),
    storage: new Storage(client),
  }
}
```

**Why server-side?** API routes need admin access for OAuth and user management.

---

## Phase 3: Authentication System

### Step 8: Basic Auth Types & Interfaces
Defined TypeScript interfaces in `src/types/auth.ts`:

```typescript
export interface User {
  $id: string
  email: string
  name: string
  emailVerification: boolean
}

export interface AuthState {
  user: User | null
  loading: boolean
}
```

### Step 9: Client-Side Auth Utilities
Created `src/client/auth.ts` for auth operations:

```typescript
import { account } from '@/lib/appwrite'
import { ID } from 'appwrite'

export const registerUser = async (email: string, password: string, name: string) => {
  const userId = ID.unique()
  await account.create(userId, email, password, name)
  await account.createEmailPasswordSession(email, password)
  return account.get()
}

export const loginUser = async (email: string, password: string) => {
  await account.createEmailPasswordSession(email, password)
  return account.get()
}

export const logoutUser = async () => {
  await account.deleteSession('current')
}

export const getCurrentUser = async () => {
  try {
    return await account.get()
  } catch {
    return null
  }
}

export const initiateGoogleAuth = async () => {
  return account.createOAuth2Session('google', `${window.location.origin}/auth/oauth-success`, `${window.location.origin}/signin`)
}
```

**Why separate client/server?** Client handles user-initiated auth, server handles OAuth callbacks.

### Step 10: Server-Side Auth Helpers
Created `src/server/auth.ts`:

```typescript
import { createAdminClient, createSessionClient } from './config'
import { cookies } from 'next/headers'

export const getCurrentUser = async () => {
  const sessionCookie = cookies().get('a_session_' + process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
  if (!sessionCookie) return null

  try {
    const { account } = createSessionClient(sessionCookie.value)
    return await account.get()
  } catch {
    return null
  }
}

export const createGoogleOAuthSession = async () => {
  const { account } = createAdminClient()
  return account.createOAuth2Token('google', `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/auth/oauth-success`, `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/auth/callback`)
}
```

### Step 11: Global Auth Context
Created `src/contexts/AuthContext.tsx`:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { getCurrentUser } from '@/client/auth'
import type { User } from '@/types/auth'

const AuthContext = createContext<{
  user: User | null
  loading: boolean
  refetchUser: () => Promise<void>
} | null>(null)

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refetchUser = async () => {
    setLoading(true)
    const user = await getCurrentUser()
    setUser(user)
    setLoading(false)
  }

  useEffect(() => {
    refetchUser()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refetchUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
```

**Why Context?** Simple global state for auth - no need for Redux/Zustand complexity.

### Step 12: Root Layout with Auth Provider
Updated `src/app/layout.tsx`:

```typescript
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'sonner'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Step 13: Basic Auth Pages
Created sign-in and sign-up pages:

**`src/app/(auth)/signin/page.tsx`:**
```typescript
'use client'

import { useState } from 'react'
import { loginUser, initiateGoogleAuth } from '@/client/auth'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SigninPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { refetchUser } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await loginUser(email, password)
      await refetchUser()
      router.push('/dashboard')
      toast.success('Signed in successfully')
    } catch (error) {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        <button type="button" onClick={initiateGoogleAuth}>
          Sign in with Google
        </button>
      </form>
    </div>
  )
}
```

**Similar structure for SignupPage.tsx**

### Step 14: OAuth Success Page
Created `src/app/auth/oauth-success/page.tsx`:

```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function OAuthSuccessPage() {
  const router = useRouter()
  const { refetchUser } = useAuth()

  useEffect(() => {
    const handleOAuth = async () => {
      await refetchUser()
      router.push('/dashboard')
    }
    handleOAuth()
  }, [refetchUser, router])

  return <div>Completing sign in...</div>
}
```

### Step 15: API Routes for OAuth
Created `src/app/api/auth/google/route.ts`:

```typescript
import { createGoogleOAuthSession } from '@/server/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const redirectUrl = await createGoogleOAuthSession()
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/signin?error=oauth_failed`)
  }
}
```

And `src/app/auth/callback/route.ts` for the redirect.

---

## Phase 4: Data Model & Database Schema

### Step 16: File Types Definition
Created `src/types/files.ts`:

```typescript
export interface FileItem {
  $id: string
  name: string
  type: 'file' | 'folder'
  userId: string
  size?: number
  mimeType?: string
  parentId?: string
  bucketFileId?: string
  $createdAt: string
  $updatedAt: string
}

export interface StorageStats {
  total: number
  documents: number
  images: number
  videos: number
  others: number
}

export interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'completed' | 'error'
}
```

### Step 17: Appwrite Database Schema Design
In Appwrite dashboard, created "files" collection with attributes:

- `name` (string, required)
- `type` (string, enum: 'file'/'folder', required)
- `userId` (string, required)
- `size` (number, optional)
- `mimeType` (string, optional)
- `parentId` (string, optional)
- `bucketFileId` (string, optional)

**Permissions:** Read/Update/Delete for `user:{userId}`

**Why this schema?**
- `parentId` enables virtual folder hierarchy (flat storage is more efficient)
- Separate `bucketFileId` links to storage
- User isolation via permissions

---

## Phase 5: File Service Layer

### Step 18: Core File Service
Created `src/services/fileService.ts`:

```typescript
import { databases, storage } from '@/lib/appwrite'
import { APPWRITE_CONFIG, FILE_LIMITS, SUPPORTED_MIME_TYPES } from '@/config/appwrite'
import { Query, ID, Permission, Role } from 'appwrite'
import type { FileItem, StorageStats } from '@/types/files'

class FileService {
  async getUserFiles(userId: string, parentId?: string): Promise<FileItem[]> {
    const queries = [
      Query.equal('userId', userId),
      Query.orderDesc('$createdAt')
    ]

    if (parentId) {
      queries.push(Query.equal('parentId', parentId))
    } else {
      queries.push(Query.isNull('parentId'))
    }

    const response = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      queries
    )

    return response.documents as FileItem[]
  }

  async uploadFile(file: File, userId: string, parentId?: string): Promise<FileItem> {
    // Validation
    if (file.size > FILE_LIMITS.maxFileSize) {
      throw new Error('File too large')
    }

    const allTypes = [...SUPPORTED_MIME_TYPES.images, ...SUPPORTED_MIME_TYPES.videos, ...SUPPORTED_MIME_TYPES.documents]
    if (!allTypes.includes(file.type)) {
      throw new Error('Unsupported file type')
    }

    // Check storage limit
    const stats = await this.getStorageStats(userId)
    if (stats.total + file.size > FILE_LIMITS.maxTotalStorage) {
      throw new Error('Storage limit exceeded')
    }

    // Upload to storage
    const bucketFile = await storage.createFile(
      APPWRITE_CONFIG.storageBucketId,
      ID.unique(),
      file
    )

    // Create database record
    const fileData = {
      name: file.name,
      type: 'file' as const,
      userId,
      size: file.size,
      mimeType: file.type,
      parentId: parentId || null,
      bucketFileId: bucketFile.$id,
    }

    const document = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      ID.unique(),
      fileData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    )

    return document as FileItem
  }

  async createFolder(name: string, userId: string, parentId?: string): Promise<FileItem> {
    const folderData = {
      name,
      type: 'folder' as const,
      userId,
      parentId: parentId || null,
    }

    const document = await databases.createDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      ID.unique(),
      folderData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ]
    )

    return document as FileItem
  }

  async deleteFile(fileId: string): Promise<void> {
    // Get file info first
    const file = await databases.getDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      fileId
    ) as FileItem

    // Delete from storage if it's a file
    if (file.type === 'file' && file.bucketFileId) {
      await storage.deleteFile(APPWRITE_CONFIG.storageBucketId, file.bucketFileId)
    }

    // Delete document
    await databases.deleteDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      fileId
    )
  }

  async moveFile(fileId: string, newParentId?: string): Promise<void> {
    await databases.updateDocument(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      fileId,
      { parentId: newParentId || null }
    )
  }

  getFileView(bucketFileId: string): string {
    return storage.getFileView(APPWRITE_CONFIG.storageBucketId, bucketFileId)
  }

  getFileDownload(bucketFileId: string): string {
    return storage.getFileDownload(APPWRITE_CONFIG.storageBucketId, bucketFileId)
  }

  async getStorageStats(userId: string): Promise<StorageStats> {
    const files = await databases.listDocuments(
      APPWRITE_CONFIG.databaseId,
      APPWRITE_CONFIG.filesCollectionId,
      [Query.equal('userId', userId), Query.equal('type', 'file')]
    )

    const stats = {
      total: 0,
      documents: 0,
      images: 0,
      videos: 0,
      others: 0,
    }

    files.documents.forEach((file: any) => {
      stats.total += file.size || 0

      if (SUPPORTED_MIME_TYPES.documents.includes(file.mimeType)) {
        stats.documents += file.size || 0
      } else if (SUPPORTED_MIME_TYPES.images.includes(file.mimeType)) {
        stats.images += file.size || 0
      } else if (SUPPORTED_MIME_TYPES.videos.includes(file.mimeType)) {
        stats.videos += file.size || 0
      } else {
        stats.others += file.size || 0
      }
    })

    return stats
  }
}

export const fileService = new FileService()
```

**Why a class?** Singleton pattern ensures consistent service usage across the app.

---

## Phase 6: React Hooks for Data Fetching

### Step 19: File Hooks
Created `src/hooks/useFiles.ts`:

```typescript
import { useState, useEffect } from 'react'
import { fileService } from '@/services/fileService'
import type { FileItem, StorageStats, UploadProgress } from '@/types/files'

export const useUserFiles = (userId: string | null, parentId?: string) => {
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFiles = async () => {
    if (!userId) return

    setLoading(true)
    setError(null)
    try {
      const data = await fileService.getUserFiles(userId, parentId)
      setFiles(data)
    } catch (err) {
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFiles()
  }, [userId, parentId])

  return { files, loading, error, refetch: fetchFiles }
}

export const useStorageStats = (userId: string | null) => {
  const [stats, setStats] = useState<StorageStats | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchStats = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const data = await fileService.getStorageStats(userId)
      setStats(data)
    } catch (err) {
      console.error('Failed to load storage stats')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [userId])

  return { stats, loading, refetch: fetchStats }
}

export const useFileUpload = (userId: string | null, parentId?: string) => {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<UploadProgress[]>([])

  const uploadFiles = async (files: FileList) => {
    if (!userId) return

    setUploading(true)
    const uploadPromises = Array.from(files).map(async (file, index) => {
      const fileId = `file-${index}`
      setProgress(prev => [...prev, { fileId, progress: 0, status: 'uploading' }])

      try {
        // Simulate progress (Appwrite doesn't provide real progress)
        const progressInterval = setInterval(() => {
          setProgress(prev => prev.map(p =>
            p.fileId === fileId && p.progress < 90
              ? { ...p, progress: p.progress + 10 }
              : p
          ))
        }, 200)

        const uploadedFile = await fileService.uploadFile(file, userId, parentId)

        clearInterval(progressInterval)
        setProgress(prev => prev.map(p =>
          p.fileId === fileId
            ? { ...p, progress: 100, status: 'completed' }
            : p
        ))

        return uploadedFile
      } catch (error) {
        setProgress(prev => prev.map(p =>
          p.fileId === fileId
            ? { ...p, status: 'error' }
            : p
        ))
        throw error
      }
    })

    try {
      await Promise.all(uploadPromises)
    } finally {
      setUploading(false)
      // Clear progress after 3 seconds
      setTimeout(() => setProgress([]), 3000)
    }
  }

  return { uploadFiles, uploading, progress }
}

export const useCreateFolder = (userId: string | null, parentId?: string) => {
  const [creating, setCreating] = useState(false)

  const createFolder = async (name: string) => {
    if (!userId) return

    setCreating(true)
    try {
      await fileService.createFolder(name, userId, parentId)
    } finally {
      setCreating(false)
    }
  }

  return { createFolder, creating }
}

export const useFileOperations = () => {
  const [operating, setOperating] = useState(false)

  const deleteFile = async (fileId: string) => {
    setOperating(true)
    try {
      await fileService.deleteFile(fileId)
    } finally {
      setOperating(false)
    }
  }

  const moveFile = async (fileId: string, newParentId?: string) => {
    setOperating(true)
    try {
      await fileService.moveFile(fileId, newParentId)
    } finally {
      setOperating(false)
    }
  }

  const getFileUrl = (bucketFileId: string, download = false) => {
    return download
      ? fileService.getFileDownload(bucketFileId)
      : fileService.getFileView(bucketFileId)
  }

  return { deleteFile, moveFile, getFileUrl, operating }
}
```

**Why hooks?** Encapsulate state management and side effects, making components cleaner.

---

## Phase 7: UI Components Development

### Step 20: Utility Functions
Created `src/utils/fileUtils.ts`:

```typescript
import { FileItem } from '@/types/files'
import { FileText, FileImage, FileVideo, Folder } from 'lucide-react'

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export const getFileIcon = (file: FileItem) => {
  if (file.type === 'folder') return Folder

  const mimeType = file.mimeType || ''
  if (mimeType.startsWith('image/')) return FileImage
  if (mimeType.startsWith('video/')) return FileVideo
  return FileText
}

export const getFileCategory = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'images'
  if (mimeType.startsWith('video/')) return 'videos'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('sheet') || mimeType.includes('presentation')) return 'documents'
  return 'others'
}
```

### Step 21: shadcn/ui Setup
Installed and configured shadcn/ui components:

```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label avatar dropdown-menu dialog progress separator sheet navigation-menu sonner
```

### Step 22: Navbar Component
Created `src/components/Navbar.tsx`:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { logoutUser } from '@/client/auth'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

export const Navbar = () => {
  const { user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    await logoutUser()
    router.push('/signin')
  }

  return (
    <nav className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">GoogleDevDrive</h1>
      <div className="flex items-center gap-4">
        <span>Welcome, {user?.name}</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
```

### Step 23: Sidebar Component
Created `src/components/Sidebar.tsx`:

```typescript
'use client'

import { useStorageStats } from '@/hooks/useFiles'
import { useAuth } from '@/contexts/AuthContext'
import { formatFileSize } from '@/utils/fileUtils'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Home, FileText, User } from 'lucide-react'
import Link from 'next/link'

export const Sidebar = () => {
  const { user } = useAuth()
  const { stats } = useStorageStats(user?.$id || null)

  const storageUsed = stats?.total || 0
  const storageLimit = 500 * 1024 * 1024 // 500MB
  const storagePercentage = (storageUsed / storageLimit) * 100

  return (
    <aside className="w-64 bg-gray-50 p-4 border-r">
      <nav className="space-y-2">
        <Link href="/dashboard">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
        <Link href="/files">
          <Button variant="ghost" className="w-full justify-start">
            <FileText className="mr-2 h-4 w-4" />
            Files
          </Button>
        </Link>
        <Link href="/profile">
          <Button variant="ghost" className="w-full justify-start">
            <User className="mr-2 h-4 w-4" />
            Profile
          </Button>
        </Link>
      </nav>

      <div className="mt-8">
        <h3 className="text-sm font-medium mb-2">Storage</h3>
        <Progress value={storagePercentage} className="mb-2" />
        <p className="text-xs text-gray-600">
          {formatFileSize(storageUsed)} of {formatFileSize(storageLimit)} used
        </p>
        {stats && (
          <div className="mt-2 text-xs text-gray-500">
            <div>Documents: {formatFileSize(stats.documents)}</div>
            <div>Images: {formatFileSize(stats.images)}</div>
            <div>Videos: {formatFileSize(stats.videos)}</div>
            <div>Others: {formatFileSize(stats.others)}</div>
          </div>
        )}
      </div>
    </aside>
  )
}
```

### Step 24: File Upload Component
Created `src/components/FileUpload.tsx`:

```typescript
'use client'

import { useState, useRef } from 'react'
import { useFileUpload } from '@/hooks/useFiles'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadProps {
  parentId?: string
  onUploadComplete?: () => void
}

export const FileUpload = ({ parentId, onUploadComplete }: FileUploadProps) => {
  const { user } = useAuth()
  const { uploadFiles, uploading, progress } = useFileUpload(user?.$id || null, parentId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    try {
      await uploadFiles(files)
      toast.success(`${files.length} file(s) uploaded successfully`)
      onUploadComplete?.()
    } catch (error) {
      toast.error('Upload failed')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4">
          Drag and drop files here, or click to select
        </p>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Select Files'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {progress.length > 0 && (
        <div className="space-y-2">
          {progress.map((p) => (
            <div key={p.fileId} className="flex items-center gap-2">
              <Progress value={p.progress} className="flex-1" />
              <span className="text-sm">
                {p.status === 'completed' ? '✓' : p.status === 'error' ? '✗' : `${p.progress}%`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

### Step 25: File Browser Component
Created `src/components/FileBrowser.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useUserFiles, useCreateFolder, useFileOperations } from '@/hooks/useFiles'
import { useAuth } from '@/contexts/AuthContext'
import { FileUpload } from './FileUpload'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { getFileIcon, formatFileSize, formatDate } from '@/utils/fileUtils'
import { Folder, FileText, MoreVertical, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import type { FileItem } from '@/types/files'

interface FileBrowserProps {
  initialParentId?: string
}

export const FileBrowser = ({ initialParentId }: FileBrowserProps) => {
  const { user } = useAuth()
  const [currentParentId, setCurrentParentId] = useState<string | undefined>(initialParentId)
  const [searchQuery, setSearchQuery] = useState('')
  const [breadcrumb, setBreadcrumb] = useState<FileItem[]>([])
  const { files, loading, refetch } = useUserFiles(user?.$id || null, currentParentId)
  const { createFolder, creating } = useCreateFolder(user?.$id || null, currentParentId)
  const { deleteFile, moveFile, getFileUrl, operating } = useFileOperations()

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleFolderClick = (folder: FileItem) => {
    setCurrentParentId(folder.$id)
    setBreadcrumb([...breadcrumb, folder])
  }

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentParentId(undefined)
      setBreadcrumb([])
    } else {
      setCurrentParentId(breadcrumb[index].$id)
      setBreadcrumb(breadcrumb.slice(0, index + 1))
    }
  }

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:')
    if (name) {
      try {
        await createFolder(name)
        refetch()
        toast.success('Folder created')
      } catch (error) {
        toast.error('Failed to create folder')
      }
    }
  }

  const handleFileAction = async (action: string, file: FileItem) => {
    switch (action) {
      case 'open':
        if (file.type === 'folder') {
          handleFolderClick(file)
        } else {
          window.open(getFileUrl(file.bucketFileId!), '_blank')
        }
        break
      case 'download':
        window.open(getFileUrl(file.bucketFileId!, true), '_blank')
        break
      case 'delete':
        if (confirm('Are you sure you want to delete this item?')) {
          try {
            await deleteFile(file.$id)
            refetch()
            toast.success('Deleted successfully')
          } catch (error) {
            toast.error('Delete failed')
          }
        }
        break
    }
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => handleBreadcrumbClick(-1)}
          className="text-blue-600 hover:underline"
        >
          Home
        </button>
        {breadcrumb.map((folder, index) => (
          <div key={folder.$id} className="flex items-center gap-2">
            <span>/</span>
            <button
              onClick={() => handleBreadcrumbClick(index)}
              className="text-blue-600 hover:underline"
            >
              {folder.name}
            </button>
          </div>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={handleCreateFolder} disabled={creating}>
          <Plus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      {/* File Upload */}
      <FileUpload parentId={currentParentId} onUploadComplete={refetch} />

      {/* File List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => {
          const Icon = getFileIcon(file)
          return (
            <div key={file.$id} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-gray-600" />
                  <div>
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {file.type === 'file' ? formatFileSize(file.size || 0) : 'Folder'} • {formatDate(file.$createdAt)}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleFileAction('open', file)}>
                      Open
                    </DropdownMenuItem>
                    {file.type === 'file' && (
                      <DropdownMenuItem onClick={() => handleFileAction('download', file)}>
                        Download
                    </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleFileAction('delete', file)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

### Step 26: Dashboard Component
Created `src/components/Dashboard.tsx`:

```typescript
'use client'

import { useUserFiles, useStorageStats } from '@/hooks/useFiles'
import { useAuth } from '@/contexts/AuthContext'
import { FileBrowser } from './FileBrowser'
import { formatFileSize } from '@/utils/fileUtils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const Dashboard = () => {
  const { user } = useAuth()
  const { files: recentFiles } = useUserFiles(user?.$id || null)
  const { stats } = useStorageStats(user?.$id || null)

  const recentFilesSlice = recentFiles.slice(0, 10)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Files</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recentFiles.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storage Used</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatFileSize(stats?.total || 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Storage Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">500 MB</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentFilesSlice.map((file) => (
              <div key={file.$id} className="flex items-center justify-between">
                <span>{file.name}</span>
                <span className="text-sm text-gray-500">{formatFileSize(file.size || 0)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File Browser</CardTitle>
        </CardHeader>
        <CardContent>
          <FileBrowser />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Step 27: Profile Component
Created `src/components/Profile.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

export const Profile = () => {
  const { user, refetchUser } = useAuth()
  const [name, setName] = useState(user?.name || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [updating, setUpdating] = useState(false)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    try {
      // API call to update profile
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, currentPassword, newPassword }),
      })

      if (response.ok) {
        await refetchUser()
        toast.success('Profile updated')
        setCurrentPassword('')
        setNewPassword('')
      } else {
        toast.error('Update failed')
      }
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setUpdating(false)
    }
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user?.email} disabled />
          </div>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={updating}>
            {updating ? 'Updating...' : 'Update Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

---

## Phase 8: Page Routing & Layout

### Step 28: Protected Route Layout
Created `src/app/(main)/layout.tsx`:

```typescript
'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Sidebar } from '@/components/Sidebar'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin')
    }
  }, [user, loading, router])

  if (loading) return <div>Loading...</div>
  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### Step 29: Page Components
Created the main pages:

**`src/app/(main)/dashboard/page.tsx`:**
```typescript
import { Dashboard } from '@/components/Dashboard'

export default function DashboardPage() {
  return <Dashboard />
}
```

**`src/app/(main)/files/page.tsx`:**
```typescript
import { FileBrowser } from '@/components/FileBrowser'

export default function FilesPage() {
  return <FileBrowser />
}
```

**`src/app/(main)/profile/page.tsx`:**
```typescript
import { Profile } from '@/components/Profile'

export default function ProfilePage() {
  return <Profile />
}
```

### Step 30: Landing Page
Updated `src/app/page.tsx`:

```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-gray-900">GoogleDevDrive</h1>
        <p className="text-xl text-gray-600 max-w-md">
          Secure cloud storage with modern interface. Upload, organize, and access your files from anywhere.
        </p>
        <div className="space-x-4">
          <Link href="/signin">
            <Button>Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button variant="outline">Sign Up</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
```

---

## Phase 9: API Routes & Server Logic

### Step 31: Profile API Route
Created `src/app/api/profile/route.ts`:

```typescript
import { getCurrentUser } from '@/server/auth'
import { createSessionClient } from '@/server/config'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({ user })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, currentPassword, newPassword } = await request.json()
    const { account } = createSessionClient(request.cookies.get('a_session_' + process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)!.value)

    // Update name if provided
    if (name && name !== user.name) {
      await account.updateName(name)
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      await account.updatePassword(newPassword, currentPassword)
    }

    // Get updated user
    const updatedUser = await account.get()

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 400 })
  }
}
```

---

## Phase 10: Refinements & Error Handling

### Step 32: Error Boundaries
Added error handling to hooks and components.

### Step 33: Loading States
Implemented skeleton loaders and loading indicators.

### Step 34: Mobile Responsiveness
Made sidebar responsive with Sheet component for mobile.

### Step 35: Final Testing
Tested all features: auth flow, file upload, folder creation, navigation, storage limits.

### Step 36: Documentation
Created README.md with setup instructions, architecture overview, and API reference.

---

## Key Decisions & Why They Were Made

1. **Single Appwrite Client**: Prevents session conflicts that plagued early versions
2. **Virtual Folder Hierarchy**: `parentId` enables folders without complex storage management
3. **ACL Permissions**: Database-level security ensures user isolation
4. **React Context for Auth**: Simple global state; no need for Redux/Zustand complexity
5. **Service Layer**: Business logic decoupled from components for testability
6. **Hooks for Data Fetching**: React-idiomatic state management
7. **TypeScript Strict**: Catches errors at compile time
8. **shadcn/ui**: Accessible, composable components
9. **Next.js App Router**: Latest features, better performance

This project evolved from a basic file uploader to a full-featured cloud storage app, with each iteration solving real problems and adding production-grade features.