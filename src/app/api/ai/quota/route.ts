// src/app/api/ai/quota/route.ts
// GET /api/ai/quota — returns current daily quota status for all AI providers.
// Use this to show a quota indicator in your UI.

import { getAllQuotas } from '@/lib/daily-quota';

export async function GET() {
  const quotas = getAllQuotas([
    // Gemini 2.0 Flash free tier: 1,500 requests/day
    { name: 'gemini', dailyLimit: 1500, haltPct: 0.85 },
    // Groq llama-3.3-70b free tier: ~1,000 requests/day (conservative estimate)
    { name: 'groq',   dailyLimit: 1000, haltPct: 0.85 },
  ]);

  return Response.json({
    ok:      true,
    date:    new Date().toISOString().slice(0, 10),
    quotas,
  });
}