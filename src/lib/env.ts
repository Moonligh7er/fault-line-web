import { z } from 'zod';

// ============================================================
// Environment validation
// ============================================================
// Parsing is *deferred* via a Proxy so module load never throws.
// Build-time page collection (e.g. /_not-found) doesn't need env
// values and would otherwise die on a ZodError when Vercel hasn't
// injected env vars yet. First property access triggers the parse.
//
// At runtime, a missing required var still throws — loudly — at
// the first site that actually reads it. That's the right tradeoff:
// build succeeds, runtime misconfiguration fails fast and visibly.
// ============================================================

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().min(16).optional(),
  KOKORO_TTS_URL: z.string().url().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_ORIGIN: z.string().url(),
  NEXT_PUBLIC_SITE_NAME: z.string().default('Fault Line'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
});

type Env = z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>;

let cached: Env | undefined;

function parseEnv(): Env {
  const clientEnv = clientSchema.parse({
    NEXT_PUBLIC_APP_ORIGIN: process.env.NEXT_PUBLIC_APP_ORIGIN,
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  });
  const serverEnv =
    typeof window === 'undefined' ? serverSchema.parse(process.env) : {};
  return { ...clientEnv, ...serverEnv };
}

export const env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!cached) cached = parseEnv();
    return cached[prop as keyof Env];
  },
  has(_target, prop: string) {
    if (!cached) cached = parseEnv();
    return prop in cached;
  },
  ownKeys() {
    if (!cached) cached = parseEnv();
    return Reflect.ownKeys(cached);
  },
  getOwnPropertyDescriptor(_target, prop: string) {
    if (!cached) cached = parseEnv();
    return Object.getOwnPropertyDescriptor(cached, prop);
  },
});
