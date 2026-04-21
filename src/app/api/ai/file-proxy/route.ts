import { NextRequest, NextResponse } from "next/server";

// ── Appwrite config ────────────────────────────────────────────────────────────
const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_HOST_URL!;
const APPWRITE_PROJECT  = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
const APPWRITE_BUCKET   = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
const APPWRITE_API_KEY  = process.env.APPWRITE_API_KEY!;

// ── Gemini config (use correct model name) ─────────────────────────────────────
const GEMINI_API_KEY    = process.env.GEMINI_API_KEY!;
// ✅ FIX: correct model name for Gemini 1.5 Flash
const GEMINI_MODEL      = "gemini-1.5-flash-latest";

// ── POST /api/ai/file-proxy ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { bucketFileId, fileName, mimeType, userMessage } = await req.json();

    if (!bucketFileId) {
      return NextResponse.json({ error: "bucketFileId is required" }, { status: 400 });
    }

    // 1️⃣ Download the raw file from Appwrite
    const fileBytes = await downloadFromAppwrite(bucketFileId);

    // 2️⃣ Extract content based on type
    const { extractedText, base64Data, isImage } = await extractContent(
      fileBytes,
      mimeType,
      fileName
    );

    // 3️⃣ Send to Gemini (supports text + vision natively)
    const aiResponse = await askGemini({
      userMessage: userMessage || "Summarize and analyze this file.",
      extractedText,
      base64Data,
      isImage,
      mimeType,
      fileName,
    });

    return NextResponse.json({ success: true, response: aiResponse, extractedText });
  } catch (err) {
    console.error("[file-proxy] Error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── Download file from Appwrite ────────────────────────────────────────────────
async function downloadFromAppwrite(fileId: string): Promise<Buffer> {
  const url = `${APPWRITE_ENDPOINT}/storage/buckets/${APPWRITE_BUCKET}/files/${fileId}/download?project=${APPWRITE_PROJECT}`;
  const res = await fetch(url, {
    headers: {
      "X-Appwrite-Project": APPWRITE_PROJECT,
      "X-Appwrite-Key": APPWRITE_API_KEY,
    },
  });
  if (!res.ok) throw new Error(`Appwrite download failed: ${res.status} ${res.statusText}`);
  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

// ── Extract text / image data ──────────────────────────────────────────────────
async function extractContent(
  fileBytes: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ extractedText: string; base64Data?: string; isImage: boolean }> {
  const lower = (mimeType || fileName || "").toLowerCase();

  // ── IMAGE ──────────────────────────────────────────────────────────────────
  if (
    lower.includes("image/") ||
    /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/.test(lower)
  ) {
    return {
      extractedText: `[Image file: ${fileName}]`,
      base64Data: fileBytes.toString("base64"),
      isImage: true,
    };
  }

  // ── PDF ────────────────────────────────────────────────────────────────────
  if (lower.includes("pdf") || lower.endsWith(".pdf")) {
    // ✅ FIX: Use pdf-parse correctly — it exports a default function
    const text = await extractPdfText(fileBytes);
    return { extractedText: text, isImage: false };
  }

  // ── Plain text / markdown / code ───────────────────────────────────────────
  if (
    lower.includes("text/") ||
    /\.(txt|md|csv|json|xml|html|js|ts|py|java|c|cpp|sh|yaml|yml)$/.test(lower)
  ) {
    const text = fileBytes.toString("utf8").slice(0, 30000); // limit tokens
    return { extractedText: text, isImage: false };
  }

  // ── Fallback: try to read as UTF-8 text ────────────────────────────────────
  try {
    const text = fileBytes.toString("utf8").slice(0, 10000);
    return { extractedText: text, isImage: false };
  } catch {
    return { extractedText: `[Binary file: ${fileName} — cannot extract text]`, isImage: false };
  }
}

// ── PDF text extraction ────────────────────────────────────────────────────────
// ✅ FIX: pdf-parse must be required this way in Next.js (dynamic import breaks it)
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse"); // direct path avoids the Next.js ESM issue
    const data = await pdfParse(buffer);
    return data.text?.trim() || "[PDF had no extractable text]";
  } catch (err) {
    console.warn("[file-proxy] pdf-parse failed, trying fallback:", err);
    // Fallback: send raw bytes as base64 to Gemini (it can read PDFs natively!)
    return "__USE_GEMINI_PDF_NATIVE__"; // signal to use Gemini native PDF
  }
}

// ── Ask Gemini ─────────────────────────────────────────────────────────────────
async function askGemini(opts: {
  userMessage: string;
  extractedText: string;
  base64Data?: string;
  isImage: boolean;
  mimeType: string;
  fileName: string;
}): Promise<string> {
  const { userMessage, extractedText, base64Data, isImage, mimeType, fileName } = opts;

  // Build parts array
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parts: any[] = [];

  // Add text context
  const prompt =
    extractedText === "__USE_GEMINI_PDF_NATIVE__"
      ? `User is asking about a PDF file named "${fileName}". User says: ${userMessage}`
      : `You are analyzing a file named "${fileName}".\n\nFile content:\n${extractedText}\n\nUser question: ${userMessage}`;

  parts.push({ text: prompt });

  // Add image or raw PDF as inline data if available
  if (isImage && base64Data) {
    parts.push({
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: base64Data,
      },
    });
  } else if (extractedText === "__USE_GEMINI_PDF_NATIVE__" && base64Data) {
    // Gemini can handle PDFs natively as inline data
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: base64Data,
      },
    });
  }

  const body = {
    contents: [{ role: "user", parts }],
    generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "Gemini returned no response."
  );
}