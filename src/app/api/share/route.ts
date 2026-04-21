import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { signToken } from '@/lib/share-token';

// ── Env vars — matches .env exactly ────────────────────────────────────────────
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
const APPWRITE_PROJECT  = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const APPWRITE_BUCKET   = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
const APP_URL           = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const GMAIL_USER        = process.env.GMAIL_USER;
const GMAIL_PASS        = process.env.GMAIL_APP_PASSWORD;

// ── Expiry parser ───────────────────────────────────────────────────────────────
function parseExpiry(expiry: string): number {
  const now = Date.now();
  if (expiry === '1h') return now + 1 * 60 * 60 * 1000;
  if (expiry === '7d') return now + 7 * 24 * 60 * 60 * 1000;
  return now + 24 * 60 * 60 * 1000; // default: 24h
}

// ── POST /api/share ─────────────────────────────────────────────────────────────
// Sharedialog.tsx sends:
//   { fileId, bucketFileId, fileName, mimeType, userId, expiry, recipientEmail? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fileId,
      bucketFileId,
      fileName,
      mimeType       = '',
      userId         = '',
      expiry         = '24h',
      recipientEmail,
    } = body;

    // ── Validate ────────────────────────────────────────────────────────────
    if (!fileId || !bucketFileId || !fileName) {
      return NextResponse.json(
        { error: 'fileId, bucketFileId and fileName are required' },
        { status: 400 }
      );
    }

    // ── Generate HMAC-signed token via share-token.ts ───────────────────────
    const expiresAt = parseExpiry(expiry);
    const token     = signToken({ fileId, bucketFileId, fileName, mimeType, userId, expiresAt });
    const shareUrl  = `${APP_URL}/share/${token}`;

    // Appwrite direct view URL — only used in the email body as a fallback hint
    const directViewUrl = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET}/files/${bucketFileId}/view?project=${APPWRITE_PROJECT}`;

    // ── No email requested — just return the link ───────────────────────────
    if (!recipientEmail) {
      return NextResponse.json({ shareUrl, emailSent: false });
    }

    // ── Email requested but not configured ─────────────────────────────────
    if (!GMAIL_USER || !GMAIL_PASS) {
      console.warn('[share] Gmail env vars not set — skipping email');
      return NextResponse.json({
        shareUrl,
        emailSent: false,
        emailNote: 'Email service not configured — copy the link manually',
      });
    }

    // ── Send email ──────────────────────────────────────────────────────────
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    const expiryLabel = expiry === '1h' ? '1 hour' : expiry === '7d' ? '7 days' : '24 hours';

    await transporter.sendMail({
      from:    `"DevDrive" <${GMAIL_USER}>`,
      to:      recipientEmail,
      subject: `📁 Someone shared "${fileName}" with you`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#fff;border-radius:12px">
          <h2 style="color:#4F46E5;margin:0 0 12px">You received a file!</h2>
          <p style="color:#333"><strong>${fileName}</strong> has been shared with you.</p>
          <a href="${directViewUrl}"
             style="display:inline-block;padding:12px 24px;background:#4F46E5;
                    color:#fff;border-radius:8px;text-decoration:none;
                    font-weight:bold;margin:16px 0">
            📂 Open File
          </a>
          <p style="color:#888;font-size:12px;margin-top:16px">
            This link expires in <strong>${expiryLabel}</strong>.<br/>
            If the button does not work, copy this link:<br/>
            <a href="${directViewUrl}" style="color:#4F46E5">${directViewUrl}</a>
          </p>
          // <hr style="border:none;border-top:1px solid #eee;margin:20px 0"/>
          // <p style="color:#ccc;font-size:11px">
          //   Direct Appwrite link (requires login): ${directViewUrl}
          // </p>
        </div>
      `,
    });

    console.log(`[share] Email sent to ${recipientEmail} — file: ${fileName}`);
    return NextResponse.json({ shareUrl, emailSent: true });

  } catch (err) {
    console.error('[share] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}