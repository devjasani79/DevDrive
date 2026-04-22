// src/lib/daily-quota.ts
// Tracks daily AI API usage per provider.
// Halts at `haltPct`% of the free-tier limit so you never hit hard rate limits.
// Resets automatically at UTC midnight (matches free-tier reset windows).

type DailyBucket = {
  count:  number;
  date:   string; // "YYYY-MM-DD" UTC
};

// In-memory store — survives for the lifetime of the server process.
// On Vercel serverless, this resets per cold start, which is fine for rate limiting.
const store = new Map<string, DailyBucket>();

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10); // e.g. "2026-04-21"
}

function tomorrowMidnightUTC(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

function getBucket(provider: string): DailyBucket {
  const today = todayUTC();
  const key   = `${provider}:${today}`;
  let bucket  = store.get(key);

  if (!bucket || bucket.date !== today) {
    // Purge stale keys from previous days
    for (const k of store.keys()) {
      if (!k.endsWith(today)) store.delete(k);
    }
    bucket = { count: 0, date: today };
    store.set(key, bucket);
  }

  return bucket;
}

// ── Public API ──────────────────────────────────────────────────────────────────

export type QuotaResult = {
  allowed:   boolean;
  used:      number;
  effective: number;   // the halt threshold (not the full daily limit)
  full:      number;   // the actual provider daily limit
  pct:       number;   // used / effective * 100
  resetsAt:  string;   // ISO timestamp of next UTC midnight
};

/**
 * Check whether the daily quota for `provider` allows another request.
 *
 * @param provider   'gemini' | 'groq' (or any string key you want)
 * @param dailyLimit Full free-tier limit for the provider (e.g. 1500 for Gemini Flash)
 * @param haltPct    Fraction at which to stop (default 0.85 = 85%)
 */
export function checkDailyQuota(
  provider: string,
  dailyLimit: number,
  haltPct = 0.85
): QuotaResult {
  const bucket    = getBucket(provider);
  const effective = Math.floor(dailyLimit * haltPct);
  const resetsAt  = tomorrowMidnightUTC();

  return {
    allowed:   bucket.count < effective,
    used:      bucket.count,
    effective,
    full:      dailyLimit,
    pct:       Math.round((bucket.count / effective) * 100),
    resetsAt,
  };
}

/**
 * Increment the counter for a provider after a successful API call.
 */
export function incrementDailyQuota(provider: string): void {
  const bucket = getBucket(provider);
  bucket.count++;
}

/**
 * Get a snapshot of all tracked providers for the current UTC day.
 * Used by GET /api/ai/quota.
 */
export function getAllQuotas(
  providers: { name: string; dailyLimit: number; haltPct?: number }[]
): Record<string, QuotaResult> {
  return Object.fromEntries(
    providers.map(({ name, dailyLimit, haltPct }) => [
      name,
      checkDailyQuota(name, dailyLimit, haltPct ?? 0.85),
    ])
  );
}