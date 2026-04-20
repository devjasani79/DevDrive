// src/app/api/share/route.ts
//
// Generates a time-limited share link for a file and optionally sends it
// via email using Resend (free tier: 3,000 emails/month).
//
// No DB changes needed — the share token encodes everything using HMAC-SHA256.
// Token format (base64url): { fileId, bucketFileId, fileName, expiresAt, userId }
// Verified on /share/[token] page before serving the file view URL.

import { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';
import { signToken, type ShareToken } from '@/lib/share-token';

const APPWRITE_ENDPOINT  = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
const APPWRITE_PROJECT   = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const APPWRITE_BUCKET    = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
const APP_URL            = process.env.NEXT_PUBLIC_APP_URL || 'https://googledev-drive.vercel.app';

// Gmail credentials
const GMAIL_USER         = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

// Token validity options (hours)
const EXPIRY_OPTIONS: Record<string, number> = {
  '1h':  1,
  '24h': 24,
  '7d':  24 * 7,
};

async function sendEmail(to: string, fileName: string, shareUrl: string, expiryLabel: string) {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.warn('[share] Gmail credentials not set — skipping email');
    return { sent: false, reason: 'Email service not configured' };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: GMAIL_USER,
      to,
      subject: `📁 ${fileName} has been shared with you on GoogleDevDrive`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>File Shared with You</title>
        </head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Oxygen','Ubuntu','Cantarell','Fira Sans','Droid Sans','Helvetica Neue',sans-serif;background-color:#f5f5f5">
          <div style="max-width:600px;margin:0 auto;padding:20px">
            <!-- Header with brand -->
            <div style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;padding:40px 24px;border-radius:12px 12px 0 0;text-align:center">
              <div style="font-size:48px;margin-bottom:16px">☁️</div>
              <h1 style="margin:0;font-size:28px;font-weight:600">GoogleDevDrive</h1>
              <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9">A file has been shared with you</p>
            </div>
            
            <!-- Main content -->
            <div style="background:white;padding:32px 24px;border-radius:0 0 12px 12px;box-shadow:0 4px 6px rgba(0,0,0,0.1)">
              <!-- Greeting -->
              <h2 style="margin:0 0 8px 0;font-size:18px;color:#1f2937">Hello!</h2>
              <p style="margin:0 0 24px 0;color:#6b7280;font-size:15px;line-height:1.6">
                Someone has shared a file with you on GoogleDevDrive. Click the button below to access it.
              </p>
              
              <!-- File info card -->
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px">
                <div style="display:flex;gap:12px;align-items:flex-start">
                  <div style="font-size:32px">📄</div>
                  <div style="flex:1;min-width:0">
                    <p style="margin:0;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.5px;font-weight:600">File Name</p>
                    <p style="margin:4px 0 0 0;font-size:16px;color:#1f2937;font-weight:600;word-break:break-word">${fileName}</p>
                  </div>
                </div>
              </div>
              
              <!-- Access details -->
              <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:16px;border-radius:4px;margin-bottom:24px">
                <p style="margin:0;color:#1e40af;font-size:13px;font-weight:600">⏱ Access Information</p>
                <p style="margin:8px 0 0 0;color:#1e3a8a;font-size:14px;line-height:1.6">
                  This shared link will expire in <strong>${expiryLabel}</strong>. After that, it will no longer be accessible.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align:center;margin-bottom:24px">
                <a href="${shareUrl}" 
                   style="display:inline-block;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:15px;transition:transform 0.2s,box-shadow 0.2s">
                  🔓 Access File Now
                </a>
              </div>
              
              <!-- Link fallback -->
              <p style="margin:16px 0;color:#6b7280;font-size:12px;text-align:center">
                Or copy this link in your browser:
              </p>
              <div style="background:#f3f4f6;padding:12px;border-radius:6px;overflow-wrap:break-word;word-break:break-all;margin-bottom:24px">
                <p style="margin:0;color:#4b5563;font-size:12px;font-family:'Courier New',monospace">${shareUrl}</p>
              </div>
              
              <!-- Security notice -->
              <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:6px;padding:12px;margin-bottom:24px">
                <p style="margin:0;color:#92400e;font-size:12px;line-height:1.5">
                  <strong>🔒 Security Tip:</strong> This link is private and should only be shared with people you trust. Never share this link publicly.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="border-top:1px solid #e5e7eb;padding-top:20px;text-align:center">
                <p style="margin:0 0 8px 0;color:#6b7280;font-size:12px">
                  Questions? Visit us at <strong>GoogleDevDrive</strong>
                </p>
                <p style="margin:0;color:#9ca3af;font-size:11px">
                  © ${new Date().getFullYear()} GoogleDevDrive. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log('[share] Email sent successfully to', to);
    return { sent: true, reason: 'Email sent successfully' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[share] Gmail error:', errorMsg);
    return { sent: false, reason: errorMsg || 'Email delivery failed' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileId, bucketFileId, fileName, mimeType, userId, expiry = '24h', recipientEmail } = body;

    if (!fileId || !bucketFileId || !fileName || !userId) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const expiryHours = EXPIRY_OPTIONS[expiry] ?? 24;
    const expiresAt   = Date.now() + expiryHours * 60 * 60 * 1000;

    const token = signToken({ fileId, bucketFileId, fileName, mimeType: mimeType || '', expiresAt, userId });
    const shareUrl = `${APP_URL}/share/${token}`;

    let emailResult = { sent: false, reason: 'No email provided' };

    if (recipientEmail) {
      const expiryLabel = expiry === '1h' ? '1 hour' : expiry === '24h' ? '24 hours' : '7 days';
      emailResult = await sendEmail(recipientEmail, fileName, shareUrl, expiryLabel);
    }

    return Response.json({
      shareUrl,
      expiresAt,
      emailSent: emailResult.sent,
      emailNote: emailResult.sent ? null : emailResult.reason,
    });

  } catch (error: any) {
    console.error('[share] Error:', error?.message);
    return Response.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}