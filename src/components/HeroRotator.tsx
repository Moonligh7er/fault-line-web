'use client';

import { useEffect, useState } from 'react';

// Home hero punchline: "fix this hopefully → eventually → ~~never~~ → faster".
// Plays once on load and settles on "faster". Server render (and no-JS /
// reduced-motion) shows "faster" directly, so crawlers and link previews
// read the real sentence; the h1 carries the full text as its aria-label.
type Step = { word: string; hold: number; strike?: boolean };
const FINAL_STEP: Step = { word: 'faster', hold: 0 };
const STEPS: Step[] = [
  { word: 'hopefully', hold: 950 },
  { word: 'eventually', hold: 950 },
  { word: 'never', hold: 1400, strike: true },
  FINAL_STEP,
];
const FINAL = STEPS.length - 1;

export default function HeroRotator() {
  // null = server render / pre-hydration
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setStep(reduce ? FINAL : 0);
  }, []);

  useEffect(() => {
    if (step === null || step >= FINAL) return;
    const t = setTimeout(() => setStep(step + 1), STEPS[step]?.hold ?? 0);
    return () => clearTimeout(t);
  }, [step]);

  const current = STEPS[step ?? FINAL] ?? FINAL_STEP;
  const classes = [
    'hero-word',
    current === FINAL_STEP ? 'hero-word--final' : 'hero-word--interim',
    current.strike && 'hero-word--strike',
    step === null && 'hero-word--ssr',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    // Period lives in the nowrap wrapper so it never wraps away from the word.
    <span aria-hidden="true" style={{ whiteSpace: 'nowrap' }}>
      <span key={current.word} className={classes}>
        {current.word}
      </span>
      .
    </span>
  );
}
