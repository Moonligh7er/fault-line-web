import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ fontSize: 48, fontWeight: 900 }}>404</h1>
      <p style={{ color: 'var(--text-secondary)', margin: '16px 0 24px' }}>
        That page doesn&apos;t exist.
      </p>
      <Link href="/" className="btn btn-primary">
        Go home
      </Link>
    </div>
  );
}
