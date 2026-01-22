# GoogleDevDrive

GoogleDevDrive is a production-ready cloud storage application inspired by Google Drive.  
It enables users to securely upload, organize, manage, and access files from anywhere through a clean and modern interface.

This project focuses on **correct authentication**, **strict access control**, and **scalable architecture**, making it suitable for real-world deployment and portfolio evaluation.

---

## Live Features

- Secure authentication (email/password, extensible OAuth)
- File upload & download
- Folder-based organization
- Per-user file isolation
- Storage usage tracking
- Responsive, modern UI
- Production-grade Appwrite integration

---

##  Tech Stack

### Frontend
- Next.js 14 (App Router)
- React + TypeScript
- Tailwind CSS
- shadcn/ui
- Lucide Icons

### Backend (BaaS)
- Appwrite
  - Authentication
  - Databases
  - Storage
  - Permissions (ACL)

---

##  Architecture Overview

```
Client (Next.js)
   ↓
Single Appwrite Client
   ↓
Account | Databases | Storage
```

> **Important**  
> The application uses **one single Appwrite client instance** across the entire codebase to avoid session desynchronization and authorization issues.

---

##  Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── layout.tsx        # Global layout & SEO
│   ├── page.tsx          # Landing page
│   └── icon.png          # Favicon
│
├── contexts/
│   └── AuthContext.tsx   # Global authentication state
│
├── lib/
│   └── appwrite.ts       # Single Appwrite client (source of truth)
│
├── services/
│   └── fileService.ts    # File & folder operations
│
├── hooks/
│   └── useFiles.ts       # Data-fetching hooks
│
├── config/
│   └── appwrite.ts       # Appwrite config & helpers
│
└── client/
    └── auth.ts           # Auth utilities
```

---

##  Authentication Flow

1. User signs in or signs up
2. Appwrite session cookie is created
3. `AuthContext` fetches the current user
4. User ID (`user.$id`) is used for:
   - File ownership
   - Database permissions
   - Storage access

No user data is trusted from the client without Appwrite verification.

---

##  Data Model (Files Collection)

### Document Schema

| Field          | Type    | Description |
|---------------|---------|-------------|
| name          | string  | File or folder name |
| type          | string  | `file` or `folder` |
| mimeType      | string  | MIME type (files only) |
| size          | number  | File size in bytes |
| parentId      | string  | Parent folder ID (nullable) |
| bucketFileId  | string  | Appwrite Storage file ID |
| userId        | string  | Owner user ID |

---

##  Storage Limits

- **Max file size:** 50 MB
- **Max total storage per user:** 500 MB

Supported file types include images, videos, and common document formats.

---

##  Permissions Model

Each document is created with the following permissions:

```ts
read   → user:{userId}
update → user:{userId}
delete → user:{userId}
```

This ensures:
- Complete user isolation
- No global read access
- No accidental data exposure

---

##  API Reference (Internal Services)

### FileService

#### `getUserFiles(userId, parentId?)`
Fetches all files and folders for a user.

#### `uploadFile(file, userId, parentId?)`
Uploads a file to Appwrite Storage and creates a database record.

#### `createFolder(name, userId, parentId?)`
Creates a new folder.

#### `deleteFile(fileId)`
Deletes a file or folder and removes associated storage data.

#### `moveFile(fileId, newParentId?)`
Moves a file or folder to a new parent.

#### `getFileView(bucketFileId)`
Returns a browser-viewable URL.

#### `getFileDownload(bucketFileId)`
Returns a downloadable file URL.

---

##  Environment Variables

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=your_collection_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
```

>  Always use **IDs**, not names, from the Appwrite dashboard.

---

##  Appwrite Setup Checklist

- Add local & production domains under **Auth → Platforms**
- Disable collection-level read permissions
- Enable bucket read/create/update/delete for `users`
- Clear old documents created without permissions

---

##  Common Issues (Solved)

- Unauthorized user errors due to multiple Appwrite clients
- Session mismatch between auth and database calls
- Incorrect collection ID usage
- Missing production domain registration

All of these are resolved in this implementation.

---

##  Project Status

- Fully functional
- Production-ready
- Secure by design
- Suitable for portfolio and real-world use

---

## Author

**Dev Jasani**  
Full-stack developer focused on clean architecture, security, and scalable web systems.

---

##  License

This project is provided for educational and demonstration purposes.
