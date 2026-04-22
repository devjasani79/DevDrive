import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Email config
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;

// ── POST /api/share ─────────────────────────────────────────────────────────────
// Now only responsible for sending email.
// The client (ShareDialog) builds the directUrl itself — no token generation here.
//
// Request body: { fileName, mimeType, directUrl, recipientEmail? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fileName,
      mimeType       = '',
      directUrl,         // pre-built Appwrite view URL from the client
      recipientEmail,
    } = body;

    if (!fileName || !directUrl) {
      return NextResponse.json(
        { error: 'fileName and directUrl are required' },
        { status: 400 }
      );
    }

    // No email requested — nothing to do (client already has the URL)
    if (!recipientEmail) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    // Email requested but not configured
    if (!GMAIL_USER || !GMAIL_PASS) {
      console.warn('[share] Gmail env vars not set — skipping email');
      return NextResponse.json({
        ok:        true,
        emailSent: false,
        emailNote: 'Email service not configured — copy the link manually',
      });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    // Friendly label for the file type
    const typeLabel = mimeType.startsWith('image/') ? '🖼️ Image'
      : mimeType === 'application/pdf'              ? '📄 PDF'
      : mimeType.startsWith('video/')               ? '🎬 Video'
      : mimeType.startsWith('text/')                ? '📝 Text'
      : '📁 File';

    await transporter.sendMail({
      from:    `"DevDrive" <${GMAIL_USER}>`,
      to:      recipientEmail,
      subject: `${typeLabel} shared with you: "${fileName}"`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;background:#fff;border-radius:12px;border:1px solid #eee">
          <h2 style="color:#4F46E5;margin:0 0 12px">Someone shared a file with you</h2>
          <p style="color:#333;margin:0 0 8px">
            <strong>${fileName}</strong> has been shared with you.
          </p>
          <p style="color:#888;font-size:13px;margin:0 0 20px">${typeLabel}</p>
          <a href="${directUrl}"
             style="display:inline-block;padding:12px 24px;background:#4F46E5;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">
            📂 Open File
          </a>
          <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
          <p style="color:#aaa;font-size:11px;margin:0">
            If the button doesn't work, copy this link:<br/>
            <a href="${directUrl}" style="color:#4F46E5;word-break:break-all">${directUrl}</a>
          </p>
        </div>
      `,
    });

    console.log(`[share] Email sent to ${recipientEmail} — file: ${fileName}`);
    return NextResponse.json({ ok: true, emailSent: true });

  } catch (err) {
    console.error('[share] Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}