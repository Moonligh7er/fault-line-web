import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ padding: '100px 24px 60px' }}>
      <div
        className="mono"
        style={{
          fontSize: 12,
          color: 'var(--steel-light)',
          letterSpacing: '2.5px',
          textTransform: 'uppercase',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 28,
        }}
      >
        <span style={{ width: 36, height: 2, background: 'var(--amber)' }} />
        Record · 024 Categories · 042 Authorities · MA / RI / NH
      </div>
      <h1
        style={{
          fontFamily: 'var(--ff-display)',
          fontSize: 'clamp(54px, 10vw, 120px)',
          fontWeight: 900,
          letterSpacing: '-3px',
          lineHeight: 0.92,
          marginBottom: 32,
          maxWidth: 1100,
        }}
      >
        Your tax dollars should
        <br />
        <span className="hero-strike">never</span>{' '}
        <em style={{ color: 'var(--amber)', fontStyle: 'italic', fontWeight: 900 }}>fix this faster</em>.
      </h1>
      <p
        style={{
          fontFamily: 'var(--ff-body)',
          fontStyle: 'italic',
          fontSize: 22,
          color: 'var(--tile-dim)',
          maxWidth: 680,
          marginBottom: 48,
          lineHeight: 1.55,
        }}
      >
        Report infrastructure issues in{' '}
        <strong style={{ color: 'var(--tile)', fontStyle: 'normal', fontWeight: 600 }}>
          ten seconds
        </strong>
        . Community-verified, GPS-stamped, legally documented. When ten neighbors point at the
        same hazard, the city&apos;s deniability runs out.
      </p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <Link href="/submit" className="btn btn-primary">
          Report an Issue
        </Link>
        <Link href="/map" className="btn btn-outline">
          Browse the Map
        </Link>
      </div>
    </div>
  );
}
