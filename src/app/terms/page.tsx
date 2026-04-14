export const metadata = { title: 'Terms of Service' };

export default function TermsPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Last updated: 2026</p>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Use of the service</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Fault Line is free to use for reporting legitimate infrastructure issues. Do not
          submit false reports, offensive content, or anything not related to public
          infrastructure.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Content you submit</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You grant Fault Line a non-exclusive license to display and share your reports
          with the community and with relevant authorities. You retain ownership.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>No warranty</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          The service is provided &quot;as is&quot; without warranty. We don&apos;t guarantee that
          authorities will act on reports.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Account termination</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          We may suspend accounts that violate these terms. You may delete your account at
          any time.
        </p>
      </section>
    </article>
  );
}
