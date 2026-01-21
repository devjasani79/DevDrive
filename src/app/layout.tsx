import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/sonner";
// import 

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/**
 * Global SEO Metadata
 * This is production-grade and search-engine friendly
 */
export const metadata: Metadata = {
  metadataBase: new URL("https://googledevdrive.com"), // change after domain final
  title: {
    default: "GoogleDevDrive – Secure Cloud Storage for Developers",
    template: "%s | GoogleDevDrive",
  },
  description:
    "GoogleDevDrive is a modern, secure cloud storage platform for developers. Upload, manage, and access your files anywhere with speed, security, and simplicity.",
  applicationName: "GoogleDevDrive",
  keywords: [
    "Google Drive Clone",
    "Cloud Storage",
    "Developer Drive",
    "File Management",
    "Next.js App",
    "Appwrite Storage",
    "Secure File Upload",
  ],
  authors: [{ name: "Dev Jasani" }],
  creator: "Dev Jasani",
  publisher: "GoogleDevDrive",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },

  /* ---------- Favicon (blank space ready) ---------- */
  icons: {
    icon: [
      { url: "E:\\webpro\\DevDrive\\DevDrive\\google-drive-clone\\google-drive-clone-main\\public\\favicon.png" },
      { url: "E:\\webpro\\DevDrive\\DevDrive\\google-drive-clone\\google-drive-clone-main\\public\\favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },

  /* ---------- OpenGraph ---------- */
  openGraph: {
    type: "website",
    siteName: "GoogleDevDrive",
    title: "GoogleDevDrive – Cloud Storage for Developers",
    description:
      "Store, sync, and manage your files securely with GoogleDevDrive. Built for speed, security, and scalability.",
    url: "https://googledevdrive.com",
    images: [
      {
        url: "/og-image.png", // optional later
        width: 1200,
        height: 630,
        alt: "GoogleDevDrive Cloud Storage",
      },
    ],
  },

  /* ---------- Twitter ---------- */
  twitter: {
    card: "summary_large_image",
    title: "GoogleDevDrive",
    description:
      "A modern Google Drive–like cloud storage built with Next.js and Appwrite.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background`}
      >
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
