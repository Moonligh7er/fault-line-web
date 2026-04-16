import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Fault Line is a free community infrastructure accountability platform by Moonlit Social Labs. Report, verify, hold accountable.',
};

export default function AboutPage() {
  const s = {
    section: { marginBottom: 32 } as const,
    h2: { fontSize: 22, fontWeight: 700, marginTop: 32, marginBottom: 12 } as const,
    p: { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 16, fontSize: 16 } as const,
    card: {
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: 16,
      marginTop: 20,
    },
    value: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 24,
    },
    vIcon: { fontSize: 28, marginBottom: 8 },
    vTitle: { fontSize: 17, fontWeight: 700, marginBottom: 6 } as const,
    vDesc: { color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 },
    contact: {
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 24,
      marginTop: 24,
    },
  };

  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8 }}>About Fault Line</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>
        A product of Moonlit Social Labs
      </p>

      <section style={s.section}>
        <p style={s.p}>
          Fault Line is a free community-powered platform for reporting potholes, broken
          streetlights, and infrastructure issues. We built it because reporting a pothole
          shouldn&apos;t be harder than the pothole itself.
        </p>
        <p style={s.p}>
          The system for reporting infrastructure problems &mdash; calling 311, waiting on
          hold, getting no confirmation, no tracking, no follow-up &mdash; was designed in
          1996. It hasn&apos;t changed. Authorities count on citizens giving up after one
          failed attempt. Fault Line changes the equation: individual complaints are easy to
          ignore; community-verified, GPS-documented, legally-significant reports with fiscal
          impact projections and public accountability scores are not.
        </p>
      </section>

      <section style={s.section}>
        <h2 style={s.h2}>How it works</h2>
        <ol style={{ marginLeft: 20, color: 'var(--text-secondary)', lineHeight: 2 }}>
          <li>Spot an issue &mdash; pothole, broken light, crumbling sidewalk, fallen tree, and 20 more categories</li>
          <li>Submit a report in 10 seconds with GPS location, photo, and severity (AI helps auto-fill)</li>
          <li>Your community verifies &mdash; when 3 people report the same problem, it&apos;s confirmed</li>
          <li>At 10 community reports, authorities are notified automatically with a professional evidence packet</li>
          <li>A public countdown tracks their response &mdash; and legal demand letters create consequences for inaction</li>
        </ol>
      </section>

      <section style={s.section}>
        <h2 style={s.h2}>What makes us different</h2>
        <div style={s.card}>
          {[
            { icon: '🆓', title: 'Free forever', desc: 'No paywall, no premium tier. Every feature is free. Supported by non-intrusive banner ads.' },
            { icon: '👤', title: 'Anonymous by default', desc: 'No account required. Report without signing in. Your identity is never attached to anonymous reports.' },
            { icon: '📊', title: 'Public accountability', desc: 'Every city gets a public infrastructure grade. Response times, fix rates, severity trends — all transparent.' },
            { icon: '⚖️', title: 'Legal teeth', desc: 'Auto-generated demand letters citing your state\'s specific statute. Insurance claim packages. Fiscal impact projections.' },
            { icon: '🔒', title: 'Privacy first', desc: 'We never sell personal data. Escalation emails are anonymized. Sensor data stays on your device.' },
            { icon: '🌍', title: 'Community powered', desc: 'When 3 people report the same issue, it\'s verified. At 10, authorities are notified. Your voice joins a chorus.' },
          ].map((v) => (
            <div key={v.title} style={s.value}>
              <div style={s.vIcon}>{v.icon}</div>
              <div style={s.vTitle}>{v.title}</div>
              <div style={s.vDesc}>{v.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={s.section}>
        <h2 style={s.h2}>Where we operate</h2>
        <p style={s.p}>
          Fault Line currently covers Massachusetts, Rhode Island, and New Hampshire with 42
          pre-configured government authorities. The app works anywhere &mdash; GPS and photo
          reporting are universal &mdash; but authority identification and auto-escalation are
          available in these three states. We expand based on community demand.
        </p>
      </section>

      <section style={s.section}>
        <h2 style={s.h2}>Our technology</h2>
        <p style={s.p}>
          Built with React Native (Expo) for mobile, Next.js for web, Supabase for the
          backend, and Claude AI for photo analysis. Reports are GPS-verified,
          community-validated, and legally timestamped. The app works offline, supports 5
          languages, and is fully accessible with screen reader support, voice commands, and
          audio-guided reporting.
        </p>
      </section>

      <div style={s.contact}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Contact</h2>
        <p style={{ ...s.p, marginBottom: 8 }}>
          All inquiries: <a href="mailto:moonlit-social-labs@proton.me">moonlit-social-labs@proton.me</a>
        </p>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
          Michael Wylde &middot; Moonlit Social Labs
        </p>
        <p style={{ ...s.p, marginTop: 12 }}>
          Want to report a bug or request a feature? Visit our{' '}
          <a href="/feedback">feedback page</a>. Want to support our work?{' '}
          <a href="https://ko-fi.com/moonlitsociallabs" target="_blank" rel="noopener">
            Buy us a coffee on Ko-fi
          </a>.
        </p>
      </div>
    </article>
  );
}
