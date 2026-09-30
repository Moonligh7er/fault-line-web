import type { Metadata } from 'next';
import FeedbackForm from './feedback-form';

export const metadata: Metadata = {
  title: 'Feedback & Feature Requests',
  description:
    'Beta. Send feedback, request features, or report bugs. Every submission is read.',
  robots: { index: true, follow: true },
};

export default function FeedbackPage() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <header style={{ textAlign: 'center', padding: '40px 0 24px' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.3)',
            color: 'var(--signal-purple)',
            padding: '6px 16px 6px 12px',
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 16,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--signal-purple)',
              boxShadow: '0 0 6px var(--signal-purple)',
            }}
          />
          Beta
        </span>
        <h1 style={{ fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 900, marginBottom: 8 }}>
          Help Shape Fault Line
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>
          We&apos;re actively building this app. Your feedback directly influences what we build next.
          Every submission is read by a real human.
        </p>
      </header>
      <FeedbackForm />
    </div>
  );
}
