# 🗂️ GoogleDev Drive

> A secure, AI-powered cloud storage platform for developers — built with Next.js, Appwrite, and Groq.

![Next.js](https://img.shields.io/badge/Next.js-16.1.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)
![Appwrite](https://img.shields.io/badge/Appwrite-18.2.0-F02E65?style=flat-square&logo=appwrite)
![Groq](https://img.shields.io/badge/Groq-Powered-orange?style=flat-square)
![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)

**Live Demo**: [googledev-drive.vercel.app](https://googledev-drive.vercel.app)

---

## ✨ Features

- **Secure Authentication** — Email/password login with Google OAuth support
- **File Management** — Upload, download, organize files in nested folders
- **AI Drive Assistant** — Conversational AI for general queries, powered by Groq
- **AI File Chat** — Ask questions about any uploaded file and get intelligent answers:
  - 📄 PDFs — full text extraction via `unpdf`, analyzed by Groq
  - 📝 Documents — text/JSON/XML read directly, analyzed by Groq
  - 🖼️ Images — visual understanding via Groq's Llama 4 Scout vision model
- **Per-User Isolation** — Strict ACL permissions, no data leakage between users
- **Storage Tracking** — Real-time storage usage monitoring per user
- **Responsive UI** — Glassmorphism-inspired design with dark/light theme support
- **Rate Limiting** — Per-user rate limits and daily AI quota tracking
- **File Sharing** — Share files via link, with optional email delivery (Gmail SMTP)

---

## 🧱 Tech Stack

### Frontend
| Package | Version | Purpose |
|---|---|---|
| Next.js | 16.1.4 | App Router + Turbopack |
| React | 19.1.0 | UI framework |
| TypeScript | 5 | Type safety |
| Tailwind CSS | 4 | Styling |
| shadcn/ui | latest | Component library (Radix UI) |
| Lucide React | 0.539.0 | Icons |
| Sonner | 2.0.7 | Toast notifications |
| Next Themes | 0.4.6 | Dark/light mode |

### Backend (BaaS)
| Package | Version | Purpose |
|---|---|---|
| Appwrite | 18.2.0 | Client SDK |
| node-appwrite | 17.2.0 | Server SDK (API routes) |

### AI
| Package | Version | Purpose |
|---|---|---|
| groq-sdk | 1.1.2 | Text chat + vision inference |
| unpdf | latest | PDF text extraction (serverless-safe) |

### Infrastructure
- **Hosting**: Vercel (Node.js 22 runtime)
- **Storage + Auth + DB**: Appwrite Cloud (sfo region)
- **Email**: Gmail SMTP via Nodemailer

---

## 📂 Project Structure

```
google-drive-clone/
├── next.config.ts                   # Next.js config (serverExternalPackages, headers)
├── tailwind.config.ts
├── tsconfig.json
│
└── src/
    ├── app/
    │   ├── layout.tsx               # Root layout
    │   ├── page.tsx                 # Landing/home page
    │   ├── globals.css
    │   ├── (auth)/
    │   │   ├── signin/page.tsx
    │   │   └── signup/page.tsx
    │   ├── (main)/
    │   │   ├── dashboard/page.tsx
    │   │   ├── files/page.tsx
    │   │   └── profile/page.tsx
    │   └── api/
    │       ├── ai/
    │       │   ├── chat/route.ts        # General AI chat (Groq)
    │       │   ├── file-chat/route.ts   # File analysis AI (Groq + unpdf)
    │       │   └── quota/route.ts       # Daily quota status
    │       ├── auth/
    │       │   ├── google/route.ts      # Google OAuth
    │       │   └── profile/route.ts     # Profile API
    │       ├── share/route.ts           # File sharing + email
    │       ├── auth.ts
    │       └── proxy.ts
    │
    ├── client/
    │   ├── auth.ts
    │   └── components/
    │       ├── AIDriveAssistant.tsx     # Sidebar AI chat
    │       ├── AIFileChat.tsx           # Per-file AI chat modal
    │       ├── Dashboard.tsx
    │       ├── FileBrowser.tsx
    │       ├── FileMenu.tsx
    │       ├── FileUpload.tsx
    │       ├── MainContent.tsx
    │       ├── Navbar.tsx
    │       ├── Profile.tsx
    │       ├── Sidebar.tsx
    │       ├── SigninPage.tsx
    │       ├── SignupPage.tsx
    │       └── ui/                      # shadcn/ui components
    │
    ├── config/
    │   ├── appwrite.ts
    │   └── cookieSettings.ts
    │
    ├── contexts/
    │   └── AuthContext.tsx
    │
    ├── hooks/
    │   └── useFiles.ts
    │
    ├── lib/
    │   ├── appwrite.ts
    │   ├── auth-utils.ts
    │   ├── daily-quota.ts               # AI quota tracking
    │   ├── rate-limit.ts                # Per-user rate limiting
    │   └── utils.ts
    │
    ├── server/
    │   ├── auth.ts
    │   └── config.ts
    │
    ├── services/
    │   └── fileService.ts
    │
    ├── types/
    │   └── files.ts
    │
    └── utils/
        └── fileUtils.ts
```

---

## 🤖 AI Architecture

All AI runs through **Groq** — no Gemini, no OpenAI, no paid APIs.

### File Chat (`/api/ai/file-chat`)

```
User opens file → AI chat modal
        │
        ▼
extractFileContent(file)
        │
        ├── PDF (application/pdf)
        │     └── unpdf extracts text → Groq llama-3.3-70b-versatile
        │
        ├── Text / JSON / XML
        │     └── raw UTF-8 read → Groq llama-3.3-70b-versatile
        │
        ├── Image (image/*)
        │     └── base64 encoded → Groq meta-llama/llama-4-scout-17b-16e-instruct (vision)
        │
        └── Other (zip, video, etc.)
              └── metadata only → Groq explains file type
```

### Models Used
| Model | Purpose |
|---|---|
| `llama-3.3-70b-versatile` | General chat, text/PDF file analysis |
| `meta-llama/llama-4-scout-17b-16e-instruct` | Image understanding (vision) |

### Why `unpdf` for PDFs
`pdf-parse` and `pdfjs-dist` both fail on Vercel's serverless runtime due to native binary dependencies and worker bundling issues. `unpdf` is a pure-JS/WASM solution built specifically for edge/serverless environments — no native deps, no workers.

> **Dev note**: `unpdf` internally uses `Promise.try` which requires Node.js 22+. Vercel runs Node 22 by default so production works fine. For local dev on older Node, add this polyfill at the top of `file-chat/route.ts`:
> ```ts
> if (typeof (Promise as any).try === 'undefined') {
>   (Promise as any).try = function<T>(fn: () => T | Promise<T>): Promise<T> {
>     return new Promise((resolve, reject) => {
>       try { resolve(fn()); } catch (err) { reject(err); }
>     });
>   };
> }
> ```

---

## 🗄️ Data Model

### Files Collection (Appwrite Database)

| Field | Type | Description | Required |
|---|---|---|---|
| `name` | string | File or folder name | ✓ |
| `type` | string | `file` or `folder` | ✓ |
| `mimeType` | string | MIME type | — |
| `size` | number | Size in bytes | — |
| `parentId` | string | Parent folder ID (null = root) | — |
| `bucketFileId` | string | Appwrite Storage file ID | — |
| `userId` | string | Owner user ID | ✓ |
| `$createdAt` | string | Auto timestamp | auto |
| `$updatedAt` | string | Auto timestamp | auto |

### Permissions (ACL)
Every document is created with strict user-scoped permissions:
```ts
read:   [`user:${userId}`]
write:  [`user:${userId}`]
delete: [`user:${userId}`]
```
Complete isolation — users can only ever see and modify their own files.

---

## 🔐 Authentication Flow

1. User signs up / signs in via email+password or Google OAuth
2. Appwrite creates a secure HTTP-only session cookie
3. `AuthContext` hydrates current user on every page load
4. All API routes verify session server-side via `node-appwrite`
5. All DB queries are scoped to `user.$id` — no trust from client

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 22+ (required for `unpdf` / `Promise.try`)
- Appwrite Cloud account (or self-hosted)
- Groq API key (free tier works)

### 1. Clone & Install
```bash
git clone <repo-url>
cd google-drive-clone
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
# Appwrite
NEXT_PUBLIC_APPWRITE_HOST_URL=https://sfo.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=your_project_id
NEXT_PUBLIC_APPWRITE_DATABASE_ID=your_database_id
NEXT_PUBLIC_APPWRITE_FILES_COLLECTION_ID=files
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=your_bucket_id
APPWRITE_API_KEY=standard_xxxxx

# AI
GROQ_API_KEY=gsk_xxxxx

# Sharing
SHARE_SECRET=your_random_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email (optional)
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
```

### 3. Appwrite Setup

**Database Collection** (`files`):
- Create attributes matching the schema above
- Add indexes on `userId`, `parentId`, `type`
- Set collection-level permissions to none (document-level ACL only)

**Storage Bucket**:
- Max file size: 50MB
- Permissions: `create: users`, `read: users`, `update: users`, `delete: users`

**Auth**:
- Add `localhost:3000` (dev) and your Vercel domain (prod) to Auth → Platforms

### 4. Groq Setup
- Create account at [console.groq.com](https://console.groq.com)
- Go to **Organization → Limits → Allowed Models**
- Make sure both of these are in the allowlist:
  - `llama-3.3-70b-versatile`
  - `meta-llama/llama-4-scout-17b-16e-instruct`

### 5. Run
```bash
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint     # lint check
```

---

## 📡 API Reference

### AI Endpoints
| Method | Route | Description |
|---|---|---|
| POST | `/api/ai/chat` | General AI assistant (Groq) |
| POST | `/api/ai/file-chat` | File-aware AI analysis (Groq + vision) |
| GET | `/api/ai/quota` | Current daily quota status |

### Auth Endpoints
| Method | Route | Description |
|---|---|---|
| GET | `/api/auth/google` | Initiate Google OAuth |
| GET | `/api/auth/profile` | Get current user profile |

### File Sharing
| Method | Route | Description |
|---|---|---|
| POST | `/api/share` | Generate share link + optional email |

### FileService (`src/services/fileService.ts`)
```ts
getUserFiles(userId, parentId?)     // list files/folders
uploadFile(file, userId, parentId?) // upload to storage + create DB record
createFolder(name, userId, parentId?) // new folder
deleteFile(fileId)                  // delete record + storage file
moveFile(fileId, newParentId?)      // move to folder
getFileView(bucketFileId)           // viewable CDN URL
getFileDownload(bucketFileId)       // download URL
```

---

## 📦 Storage Limits

| Limit | Value |
|---|---|
| Max file size | 50 MB |
| Max storage per user | 500 MB |
| AI context window (text) | 20,000 chars |
| AI image size (base64) | 4 MB |
| Daily Groq requests | ~1,000 |

---

## 🔒 Security

- HTTP-only secure session cookies (Appwrite managed)
- Server-side session verification on all API routes
- Document-level ACL — no cross-user data access possible
- Rate limiting per user IP on all AI endpoints
- Daily quota tracking to prevent abuse
- No client-supplied user data trusted without server verification

---

## 🛠️ Scripts

```bash
npm run dev      # Dev server with Turbopack
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

---

## 🙏 Acknowledgments

- [Appwrite](https://appwrite.io) — incredible open-source BaaS
- [Groq](https://groq.com) — blazing fast inference
- [unpdf](https://github.com/unjs/unpdf) — the only PDF parser that actually works on Vercel
- [shadcn/ui](https://ui.shadcn.com) — beautiful, accessible components
- [Next.js](https://nextjs.org) — the backbone of it all

---


## 👤 Author

**Dev Jasani & jasman Singh Chagger**  
Full-stack developer focused on clean architecture, security, and scalable web systems.

---

## 📄 License

This project is provided for educational and demonstration purposes.
