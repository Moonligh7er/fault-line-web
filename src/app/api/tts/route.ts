import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/rate-limit';

// Proxy to the shared Kokoro TTS server. Avoids exposing the upstream URL
// to browser clients and centralizes voice/speed validation. Modal scales
// to zero when idle, so the first request after a quiet period takes
// 10–15 s; subsequent requests are sub-second. The upstream URL comes only
// from KOKORO_TTS_URL; without it read-aloud is off and the client falls
// back to the browser's own speech.

const KOKORO_ENDPOINT = process.env.KOKORO_TTS_URL?.trim() || null;

const ALLOWED_VOICES = new Set([
  'af_bella',
  'af_sarah',
  'af_nicole',
  'am_adam',
  'am_michael',
  'bf_emma',
  'bf_isabella',
  'bm_george',
  'bm_lewis',
]);

const MAX_TEXT_LENGTH = 2000;
const REQUEST_TIMEOUT_MS = 25_000;

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  if (!KOKORO_ENDPOINT) {
    return NextResponse.json({ error: 'Read-aloud is not available.' }, { status: 503 });
  }
  const perVisitor = await checkRateLimit('tts', getRateLimitKey(null, req.headers));
  if (!perVisitor.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  const global = await checkRateLimit('tts_global', 'all');
  if (!global.success) {
    return NextResponse.json({ error: 'Read-aloud is busy. Try again later.' }, { status: 429 });
  }

  let body: { text?: string; voice?: string; speed?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = (body.text ?? '').trim();
  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json(
      { error: `text exceeds ${MAX_TEXT_LENGTH} characters` },
      { status: 413 },
    );
  }

  const voice = ALLOWED_VOICES.has(body.voice ?? '') ? body.voice! : 'bf_emma';
  const rawSpeed = typeof body.speed === 'number' ? body.speed : 1.0;
  const speed = Math.min(Math.max(rawSpeed, 0.5), 2.0);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);

  try {
    const upstream = await fetch(KOKORO_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/wav' },
      body: JSON.stringify({ text, voice, speed }),
      signal: ctrl.signal,
    });

    if (!upstream.ok) {
      console.error('[tts] upstream status', upstream.status);
      return NextResponse.json({ error: 'Read-aloud failed. Try again.' }, { status: 502 });
    }

    const audio = await upstream.arrayBuffer();
    return new NextResponse(audio, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        // Allow short browser caching for repeat phrases (1 hour).
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    const isTimeout = (err as Error)?.name === 'AbortError';
    if (!isTimeout) console.error('[tts] upstream request failed', err);
    return NextResponse.json(
      { error: isTimeout ? 'Read-aloud timed out. Try again.' : 'Read-aloud failed. Try again.' },
      { status: isTimeout ? 504 : 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}

// Lightweight GET — proxy the Kokoro health endpoint.
export async function GET() {
  if (!KOKORO_ENDPOINT) return NextResponse.json({ ok: false }, { status: 503 });
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(
      KOKORO_ENDPOINT.replace('-tts.modal.run', '-health.modal.run'),
      { signal: ctrl.signal },
    );
    clearTimeout(t);
    return NextResponse.json({ ok: res.ok }, { status: res.ok ? 200 : 503 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
