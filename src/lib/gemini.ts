// ✅ FIX: The model "gemini-1.5-flash" must be called as "gemini-1.5-flash-latest"
// or use "gemini-2.0-flash" for the newest version.
// The old "models/gemini-1.5-flash" v1beta path is deprecated — use this:

export const GEMINI_MODELS = {
  flash: "gemini-1.5-flash-latest",       // ✅ works
  flash2: "gemini-2.0-flash",             // ✅ newest, faster
  pro: "gemini-1.5-pro-latest",           // ✅ smarter but slower
} as const;

export const GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models";

export async function callGemini(
  model: keyof typeof GEMINI_MODELS,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  contents: any[],
  apiKey: string
): Promise<string> {
  const modelName = GEMINI_MODELS[model];
  const res = await fetch(
    `${GEMINI_BASE_URL}/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 2048, temperature: 0.4 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini [${modelName}] ${res.status}: ${err}`);
  }

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ??
    "No response from Gemini."
  );
}