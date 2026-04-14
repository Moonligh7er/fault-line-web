import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ textAlign: 'center', padding: '60px 24px' }}>
      <h1
        style={{
          fontSize: 'clamp(36px, 6vw, 56px)',
          fontWeight: 900,
          letterSpacing: '-1px',
          marginBottom: 16,
        }}
      >
        Your Tax Dollars
        <br />
        Should <span style={{ color: 'var(--primary)' }}>Fix This Faster</span>
      </h1>
      <p
        style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          maxWidth: 600,
          margin: '0 auto 32px',
          lineHeight: 1.6,
        }}
      >
        Report potholes, broken streetlights, and crumbling infrastructure. When
        your community speaks up together, authorities can&apos;t look away.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/submit" className="btn btn-primary">
          Report an Issue
        </Link>
        <Link href="/map" className="btn btn-outline">
          Browse Map
        </Link>
      </div>
    </div>
  );
}
