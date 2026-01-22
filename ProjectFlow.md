# Google Drive Clone - Project Flow & Structure

## Directory Structure Overview

```
📁 google-drive-clone/
├── 📄 package.json - Dependencies & scripts
├── 📄 tsconfig.json - TypeScript config
├── 📄 next.config.ts - Next.js config
├── 📄 components.json - UI component config
├── 📄 README.md - Project info
└── 📁 src/
    ├── 📁 app/ - Next.js App Router
    │   ├── 📄 layout.tsx - Root layout with auth provider
    │   ├── 📄 page.tsx - Landing page
    │   ├── 📄 globals.css - Global styles
    │   ├── 📄 middleware.ts - Route protection
    │   ├── 📁 (auth)/ - Auth routes group
    │   │   ├── 📁 signin/page.tsx - Sign in page
    │   │   └── 📁 signup/page.tsx - Sign up page
    │   ├── 📁 (main)/ - Protected routes group
    │   │   ├── 📁 dashboard/page.tsx - Dashboard
    │   │   ├── 📁 files/page.tsx - File browser
    │   │   └── 📁 profile/page.tsx - User profile
    │   └── 📁 api/ - API routes
    │       ├── 📁 auth/google/route.ts - Google OAuth
    │       ├── 📁 profile/route.ts - Profile API
    │       ├── 📁 signin/route.ts - Login API
    │       ├── 📁 signout/route.ts - Logout API
    │       └── 📁 signup/route.ts - Register API
    ├── 📁 components/ - React components
    │   ├── 📁 ui/ - Reusable UI components
    │   │   ├── 📄 button.tsx - Button component
    │   │   ├── 📄 card.tsx - Card component
    │   │   ├── 📄 dialog.tsx - Modal dialog
    │   │   ├── 📄 input.tsx - Input field
    │   │   └── 📄 ... (15+ more UI components)
    │   ├── 📄 Dashboard.tsx - Main dashboard
    │   ├── 📄 FileBrowser.tsx - File explorer
    │   ├── 📄 FileMenu.tsx - File actions menu
    │   ├── 📄 FileUpload.tsx - Upload component
    │   ├── 📄 MainContent.tsx - Dashboard content
    │   ├── 📄 Navbar.tsx - Top navigation
    │   ├── 📄 Profile.tsx - Profile page
    │   ├── 📄 Sidebar.tsx - Side navigation
    │   ├── 📄 SigninPage.tsx - Login form
    │   └── 📄 SignupPage.tsx - Register form
    ├── 📁 contexts/ - React contexts
    │   └── 📄 AuthContext.tsx - Global auth state
    ├── 📁 hooks/ - Custom React hooks
    │   └── 📄 useFiles.ts - File management hooks
    ├── 📁 lib/ - Utility libraries
    │   ├── 📄 appwrite.ts - Appwrite client
    │   ├── 📄 auth-utils.ts - Auth helpers
    │   ├── 📄 cookieSettings.ts - Cookie config
    │   └── 📄 utils.ts - General utils
    ├── 📁 server/ - Server-side code
    │   ├── 📄 auth.ts - Server auth functions
    │   ├── 📄 config.ts - Server config
    │   └── 📁 services/
    │       └── 📄 fileService.ts - File operations
    ├── 📁 types/ - TypeScript types
    │   └── 📄 files.ts - File-related types
    ├── 📁 utils/ - Utility functions
    │   └── 📄 fileUtils.ts - File helpers
    └── 📁 config/ - Configuration
        └── 📄 appwrite.ts - Appwrite settings
```

## Application Flow

### 1. User Entry Point
**File**: `src/app/page.tsx`
- Landing page with marketing content
- Sign in/Sign up buttons
- Features showcase

### 2. Authentication Flow
**Files**: `src/app/(auth)/*/page.tsx` + `src/components/SigninPage.tsx`
- User authentication (email/password + Google OAuth)
- Form validation and error handling
- Redirect to dashboard on success

**API Routes**: `src/app/api/auth/*/route.ts`
- Server-side auth processing
- Session management
- OAuth callback handling

### 3. Dashboard Experience
**File**: `src/app/(main)/dashboard/page.tsx` → `src/components/Dashboard.tsx`
- Main application layout
- Sidebar navigation + top navbar
- Protected route (requires authentication)

**Components**:
- `Navbar.tsx` - User menu, theme toggle
- `Sidebar.tsx` - Navigation links
- `MainContent.tsx` - Recent files + storage stats

### 4. File Management
**File**: `src/app/(main)/files/page.tsx` → `src/components/FileBrowser.tsx`
- Full file explorer interface
- Folder navigation with breadcrumbs
- Search and filter functionality
- Grid/List view modes

**Key Features**:
- Create folders
- Upload files (drag & drop)
- Move/delete files
- File operations menu

### 5. Data Flow Architecture

#### Authentication State
```
AuthContext → useAuth() hook → Components
     ↓
User data stored globally
Session cookies managed by middleware
```

#### File Operations
```
Components → useFiles hooks → fileService → Appwrite API
     ↓
Database queries + Storage operations
Real-time UI updates via React state
```

#### Upload Flow
```
FileUpload → useFileUpload hook → fileService.uploadFile()
     ↓
Validate size/type → Upload to storage → Create DB record
Progress tracking → Success/error notifications
```

## Core Dependencies & Their Purpose

### Framework & Runtime
- **Next.js 15** - React framework with App Router, SSR, API routes
- **React 19** - UI library with modern features
- **TypeScript 5** - Type-safe JavaScript

### Backend & Database
- **Appwrite** - BaaS for auth, database, storage
- **node-appwrite** - Server-side Appwrite SDK

### UI & Styling
- **Tailwind CSS 4** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI primitives
- **Shadcn/ui** - Beautiful component library
- **Lucide React** - Modern icon library
- **Heroicons** - Additional icons

### Utilities
- **Sonner** - Toast notifications
- **next-themes** - Dark/light theme support
- **class-variance-authority** - Component variants
- **clsx + tailwind-merge** - Conditional styling

## Key Features Implemented

### ✅ Authentication System
- Email/password registration & login
- Google OAuth integration
- Session management with secure cookies
- Route protection middleware
- Profile management

### ✅ File Management
- File upload with progress tracking (50MB limit)
- Folder creation and organization
- File browsing with navigation
- Search and filter capabilities
- File operations (view, download, delete, move)
- Storage usage tracking (500MB total limit)

### ✅ User Interface
- Responsive design (mobile-friendly)
- Dark/light theme support
- Modern, clean UI with Shadcn/ui
- Loading states and error handling
- Toast notifications

### ✅ Security & Performance
- Type-safe with TypeScript
- Secure authentication flow
- Input validation (client + server)
- File type and size restrictions
- User-scoped data access

## Database Schema

### Files Collection (Appwrite)
```typescript
interface FileItem {
  $id: string;              // Unique ID
  name: string;             // File/folder name
  type: 'file' | 'folder';  // Item type
  mimeType?: string;        // MIME type (files)
  size: number;             // Size in bytes
  parentId?: string;        // Parent folder ID
  userId: string;           // Owner ID
  bucketFileId?: string;    // Storage file ID
  $createdAt: string;       // Created timestamp
  $updatedAt: string;       // Updated timestamp
}
```

## API Architecture

### Authentication APIs
- `POST /api/signup` - User registration
- `POST /api/signin` - User login
- `POST /api/signout` - User logout
- `PUT /api/profile` - Update profile
- `GET /api/auth/google` - OAuth callback

### File Operations (via Service Layer)
- `fileService.getUserFiles()` - List files
- `fileService.uploadFile()` - Upload file
- `fileService.createFolder()` - Create folder
- `fileService.deleteFile()` - Delete file
- `fileService.moveFile()` - Move file
- `fileService.getStorageStats()` - Usage stats

## Development Workflow

### Scripts
- `npm run dev` - Development server (with Turbopack)
- `npm run build` - Production build
- `npm run start` - Production server
- `npm run lint` - Code linting

### Environment Setup
```env
NEXT_PUBLIC_APPWRITE_HOST_URL=https://your-appwrite-instance.com/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your-database-id
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=your-collection-id
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your-bucket-id
APPWRITE_API_KEY=your-server-api-key
```

## Architecture Strengths

1. **Clean Separation**: Client/server/auth code separation
2. **Type Safety**: Full TypeScript coverage
3. **Reusable Components**: Modular UI components
4. **Custom Hooks**: Clean data management
5. **Security**: Proper auth and validation
6. **Scalability**: Service-based architecture
7. **Modern Stack**: Latest Next.js + React versions

## Project Status: Production Ready MVP

This Google Drive Clone successfully implements core cloud storage functionality with a modern, secure, and scalable architecture. The codebase demonstrates professional full-stack development practices and is ready for deployment with proper Appwrite configuration.
