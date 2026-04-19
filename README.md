# GoogleDevDrive

GoogleDevDrive is a production-ready cloud storage application inspired by Google Drive.
It enables users to securely upload, organize, manage, and access files from anywhere through a clean and modern interface.
This project focuses on **correct authentication**, **strict access control**, and **scalable architecture**, making it suitable for real-world deployment and portfolio evaluation.

## 🚀 Live Features

- **Secure Authentication**: Email/password login with extensible OAuth support (Google, etc.)
- **File Management**: Upload, download, organize files in folders
- **AI-Powered Features**:
  - AI Chat: Conversational AI assistant for general queries
  - File Chat: AI-powered analysis and Q&A about uploaded files
- **User Isolation**: Per-user file isolation with strict ACL permissions
- **Storage Tracking**: Real-time storage usage monitoring
- **Responsive UI**: Modern, glassmorphism-inspired design with dark/light themes
- **Production-Grade Backend**: Appwrite integration for auth, database, and storage

---

## 🧱 Tech Stack

### Frontend
- **Next.js 16.1.4** (App Router with Turbopack)
- **React 19.1.0** + **TypeScript 5**
- **Tailwind CSS 4** + **PostCSS**
- **shadcn/ui** (Radix UI components)
- **Lucide React** (Icons)
- **Sonner** (Toast notifications)
- **Next Themes** (Theme switching)

### Backend (BaaS)
- **Appwrite 18.2.0**
  - Authentication & Sessions
  - Databases with ACL
  - File Storage with permissions
  - Server-side SDK for API routes

### AI Integration
- **Google Generative AI** (@google/generative-ai 0.24.1)
- **Groq SDK** (groq-sdk 1.1.2) for fast AI responses

### Development Tools
- **ESLint 9** + **Next.js ESLint Config**
- **TypeScript** with strict mode
- **Tailwind CSS** with custom animations

---

## 📂 Full Project Structure

```
google-drive-clone-main/
├── components.json              # shadcn/ui configuration
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── next-env.d.ts                # Next.js TypeScript declarations
├── package.json                 # Dependencies and scripts
├── postcss.config.mjs           # PostCSS configuration
├── README.md                    # This file
├── study.md                     # Project notes/study
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
└── public/                      # Static assets
    └── (favicon, images, etc.)

└── src/
    ├── app/                     # Next.js App Router
    │   ├── globals.css          # Global styles
    │   ├── layout.tsx           # Root layout
    │   ├── page.tsx             # Home page
    │   ├── (auth)/              # Auth route group
    │   │   ├── signin/
    │   │   │   └── page.tsx     # Sign-in page
    │   │   └── signup/
    │   │       └── page.tsx     # Sign-up page
    │   └── (main)/              # Main app route group
    │       ├── dashboard/
    │       │   └── page.tsx     # Dashboard
    │       ├── files/
    │       │   └── page.tsx     # File browser
    │       └── profile/
    │           └── page.tsx     # User profile
    │   └── api/                 # API routes
    │       ├── ai/
    │       │   ├── chat/
    │       │   │   └── route.ts # AI chat API
    │       │   └── file-chat/
    │       │       └── route.ts # File analysis API
    │       └── auth/
    │           ├── google/
    │           │   └── route.ts # Google OAuth
    │           └── profile/
    │               └── route.ts # Profile API
    │       └── auth.ts          # Auth API utilities
    │       └── proxy.ts         # Proxy utilities
    │
    ├── client/                  # Client-side utilities
    │   ├── auth.ts              # Auth client functions
    │   └── components/          # Reusable components
    │       ├── AIDriveAssistant.tsx  # AI chat component
    │       ├── AIFileChat.tsx       # File chat component
    │       ├── Dashboard.tsx        # Dashboard component
    │       ├── FileBrowser.tsx      # File browser
    │       ├── FileMenu.tsx         # File context menu
    │       ├── FileUpload.tsx       # File upload component
    │       ├── MainContent.tsx      # Main content wrapper
    │       ├── Navbar.tsx           # Navigation bar
    │       ├── Profile.tsx          # Profile component
    │       ├── Sidebar.tsx          # Sidebar navigation
    │       ├── SigninPage.tsx       # Sign-in form
    │       ├── SignupPage.tsx       # Sign-up form
    │       └── ui/                  # shadcn/ui components
    │           ├── avatar.tsx
    │           ├── badge.tsx
    │           ├── button.tsx
    │           ├── card.tsx
    │           ├── dashboard-skeleton.tsx
    │           ├── dialog.tsx
    │           ├── dropdown-menu.tsx
    │           ├── google-signin-button.tsx
    │           ├── input.tsx
    │           ├── label.tsx
    │           ├── navigation-menu.tsx
    │           ├── progress.tsx
    │           ├── separator.tsx
    │           ├── sheet.tsx
    │           ├── skeleton.tsx
    │           └── sonner.tsx
    │
    ├── config/                   # Configuration files
    │   ├── appwrite.ts           # Appwrite client config
    │   └── cookieSettings.ts     # Cookie settings
    │
    ├── contexts/                 # React contexts
    │   └── AuthContext.tsx       # Authentication context
    │
    ├── env.ts                    # Environment variables
    │
    ├── hooks/                    # Custom React hooks
    │   └── useFiles.ts           # File management hooks
    │
    ├── lib/                      # Utility libraries
    │   ├── appwrite.ts           # Appwrite utilities
    │   ├── auth-utils.ts         # Auth utilities
    │   ├── cookieSettings.ts     # Cookie utilities
    │   └── utils.ts              # General utilities
    │
    ├── server/                   # Server-side utilities
    │   ├── auth.ts               # Server auth
    │   └── config.ts             # Server config
    │
    ├── services/                 # Business logic services
    │   └── fileService.ts        # File operations service
    │
    ├── types/                    # TypeScript type definitions
    │   └── files.ts              # File-related types
    │
    └── utils/                    # Utility functions
        └── fileUtils.ts          # File utility functions
```

---

## 🔐 Authentication Flow

1. **User Registration/Login**: User signs up or signs in via email/password or OAuth
2. **Session Creation**: Appwrite creates a secure session cookie
3. **Context Initialization**: `AuthContext` fetches and stores current user data
4. **Permission Enforcement**: All operations use `user.$id` for:
   - File ownership verification
   - Database query filtering
   - Storage access control

**Security Notes**:
- No client-side user data is trusted without server verification
- All database operations include user-specific permissions
- Session cookies are HTTP-only and secure

---

## 🗄️ Data Model

### Files Collection Schema

| Field          | Type    | Description                          | Required |
|---------------|---------|--------------------------------------|----------|
| name          | string  | File or folder name                  | ✓        |
| type          | string  | `file` or `folder`                   | ✓        |
| mimeType      | string  | MIME type (files only)               | ✗        |
| size          | number  | File size in bytes                   | ✗        |
| parentId      | string  | Parent folder ID (null for root)     | ✗        |
| bucketFileId  | string  | Appwrite Storage file ID             | ✗        |
| userId        | string  | Owner user ID                        | ✓        |
| $createdAt    | string  | Creation timestamp                   | Auto     |
| $updatedAt    | string  | Last update timestamp                | Auto     |

### Permissions (ACL)
Each document is created with user-specific permissions:
```typescript
{
  read: [`user:${userId}`],
  write: [`user:${userId}`],
  delete: [`user:${userId}`]
}
```

This ensures complete data isolation between users.

---

## 🤖 AI Features

### AI Chat
- **Endpoint**: `/api/ai/chat`
- **Purpose**: General conversational AI assistant
- **Integration**: Uses Groq SDK for fast responses
- **Component**: `AIDriveAssistant.tsx`

### File Chat
- **Endpoint**: `/api/ai/file-chat`
- **Purpose**: AI-powered analysis of uploaded files
- **Features**:
  - Document Q&A
  - Content summarization
  - File insights
- **Integration**: Google Generative AI for advanced analysis
- **Component**: `AIFileChat.tsx`

---

## 📦 Storage & Limits

- **Max File Size**: 50 MB per file
- **Max Total Storage**: 500 MB per user
- **Supported Formats**: Images, videos, PDFs, documents, archives
- **Storage Provider**: Appwrite Storage with CDN delivery

---

## 📡 API Reference

### File Service (`services/fileService.ts`)

#### Core Functions
- `getUserFiles(userId, parentId?)`: Fetch user's files/folders
- `uploadFile(file, userId, parentId?)`: Upload and store file
- `createFolder(name, userId, parentId?)`: Create new folder
- `deleteFile(fileId)`: Delete file/folder and storage
- `moveFile(fileId, newParentId?)`: Move file/folder
- `getFileView(bucketFileId)`: Get viewable URL
- `getFileDownload(bucketFileId)`: Get download URL

### AI API Routes
- `POST /api/ai/chat`: General AI chat
- `POST /api/ai/file-chat`: File-specific AI analysis

### Auth API Routes
- `POST /api/auth/google`: Google OAuth callback
- `GET /api/auth/profile`: User profile data

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Appwrite Cloud account or self-hosted instance

### 1. Clone Repository
```bash
git clone <repository-url>
cd google-drive-clone
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create `.env.local` in the root directory:

```env
# Appwrite Configuration
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=your_collection_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id

# AI Configuration
GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_key
GROQ_API_KEY=your_groq_api_key
```

### 4. Appwrite Setup
1. Create a new Appwrite project
2. Create a database and files collection with the schema above
3. Create a storage bucket for file uploads
4. Configure permissions as specified
5. Add your domain to Auth → Platforms

### 5. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` to access the application.

### 6. Build for Production
```bash
npm run build
npm start
```

---

## 🔧 Configuration Details

### Appwrite Database Setup
1. **Collection**: `files`
2. **Permissions**: 
   - Collection: No read permissions (enforce via document permissions)
   - Documents: User-specific read/write/delete
3. **Indexes**: Create indexes on `userId`, `parentId`, `type` for efficient queries

### Storage Bucket Setup
1. **Bucket**: `files`
2. **Permissions**: 
   - Create: `users`
   - Read: `users`
   - Update: `users`
   - Delete: `users`
3. **File Size Limit**: 50MB
4. **Allowed File Types**: All types (client-side validation)

### AI Configuration
- **Google AI**: For file analysis and complex queries
- **Groq**: For fast, general chat responses
- API keys required for AI features to work

---

## 🧪 Testing & Development

### Available Scripts
```bash
npm run dev      # Start development server with Turbopack
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Development Notes
- Uses Next.js 16 with App Router
- Turbopack for fast development builds
- TypeScript with strict mode enabled
- ESLint for code quality
- Tailwind CSS with custom glassmorphism theme

---

## 🔒 Security Considerations

- **Session Management**: HTTP-only cookies, secure flags
- **Data Isolation**: User-specific permissions on all resources
- **Input Validation**: Client and server-side validation
- **File Upload Security**: MIME type checking, size limits
- **API Security**: Server-side authentication checks

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Style
- TypeScript strict mode
- ESLint configuration
- Consistent naming conventions
- Comprehensive error handling

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Appwrite** for the excellent BaaS platform
- **shadcn/ui** for the beautiful component library
- **Google AI** and **Groq** for AI capabilities
- **Next.js** team for the amazing framework

---

*Built with ❤️ using Next.js, Appwrite, and modern web technologies.*

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

## 📦 Storage Limits

- **Max file size:** 50 MB
- **Max total storage per user:** 500 MB

Supported file types include images, videos, and common document formats.

---

## 🔑 Permissions Model

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

## 📡 API Reference (Internal Services)

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

## 🌍 Environment Variables

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://sfo.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=your_collection_id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
```

> ⚠️ Always use **IDs**, not names, from the Appwrite dashboard.

---

## ⚙️ Appwrite Setup Checklist

- Add local & production domains under **Auth → Platforms**
- Disable collection-level read permissions
- Enable bucket read/create/update/delete for `users`
- Clear old documents created without permissions

---

## 🧪 Common Issues (Solved)

- Unauthorized user errors due to multiple Appwrite clients
- Session mismatch between auth and database calls
- Incorrect collection ID usage
- Missing production domain registration

All of these are resolved in this implementation.

---

## 📌 Project Status

- Fully functional
- Production-ready
- Secure by design
- Suitable for portfolio and real-world use

---

## 👤 Author

**Dev Jasani**  
Full-stack developer focused on clean architecture, security, and scalable web systems.

---

## 📄 License

This project is provided for educational and demonstration purposes.
