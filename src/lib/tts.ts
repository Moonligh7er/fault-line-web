// ============================================================
// Browser-side helper for the Kokoro TTS proxy at /api/tts.
// ============================================================
// Posts text → /api/tts → receives audio/wav → plays via HTMLAudio.
// Falls back to the Web Speech API on failure (network, server down).
// ============================================================

export type KokoroVoice =
  | 'af_bella'
  | 'af_sarah'
  | 'af_nicole'
  | 'am_adam'
  | 'am_michael'
  | 'bf_emma'
  | 'bf_isabella'
  | 'bm_george'
  | 'bm_lewis';

export interface SpeakOptions {
  voice?: KokoroVoice;
  speed?: number;
  onStart?: () => void;
  onDone?: () => void;
}

let activeAudio: HTMLAudioElement | null = null;
let activeUrl: string | null = null;

export async function speak(text: string, opts: SpeakOptions = {}): Promise<void> {
  const trimmed = text?.trim();
  if (!trimmed) {
    opts.onDone?.();
    return;
  }

  stopAll();

  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        voice: opts.voice ?? 'bf_emma',
        speed: opts.speed ?? 1.0,
      }),
    });
    if (!res.ok) throw new Error(`TTS proxy: ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    activeUrl = url;

    const audio = new Audio(url);
    activeAudio = audio;
    audio.addEventListener('play', () => opts.onStart?.());
    audio.addEventListener('ended', () => {
      cleanup(audio, url);
      opts.onDone?.();
    });
    audio.addEventListener('error', () => {
      cleanup(audio, url);
      fallbackBrowserTTS(trimmed, opts);
    });

    await audio.play().catch(() => {
      cleanup(audio, url);
      fallbackBrowserTTS(trimmed, opts);
    });
  } catch (err) {
    console.warn('[tts] Kokoro proxy failed, falling back:', err);
    fallbackBrowserTTS(trimmed, opts);
  }
}

export function stopAll(): void {
  if (activeAudio) {
    try {
      activeAudio.pause();
    } catch {
      // ignore
    }
  }
  if (activeUrl) {
    URL.revokeObjectURL(activeUrl);
    activeUrl = null;
  }
  activeAudio = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

function cleanup(audio: HTMLAudioElement, url: string) {
  if (activeAudio === audio) activeAudio = null;
  if (activeUrl === url) {
    URL.revokeObjectURL(url);
    activeUrl = null;
  }
}

function fallbackBrowserTTS(text: string, opts: SpeakOptions) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    opts.onDone?.();
    return;
  }
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = (opts.speed ?? 1.0) * 0.95;
  utter.lang = 'en-US';
  utter.onstart = () => opts.onStart?.();
  utter.onend = () => opts.onDone?.();
  utter.onerror = () => opts.onDone?.();
  window.speechSynthesis.speak(utter);
}
