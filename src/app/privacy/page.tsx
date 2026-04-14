export const metadata = { title: 'Privacy Policy' };

export default function PrivacyPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>Last updated: 2026</p>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>What we collect</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          We collect only what&apos;s necessary to operate the service: your email (for
          sign-in), reports you submit, and votes you cast. Reports include GPS coordinates,
          a photo (optional), and any description you provide.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>What we don&apos;t collect</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          We don&apos;t track you across sites. We don&apos;t sell your data. We don&apos;t use
          behavioral advertising. We don&apos;t store payment information.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Cookies</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          We use essential, httpOnly, same-site cookies for authentication. We use Google
          Analytics with IP anonymization to understand aggregate usage.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Anonymous reports</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You can submit reports anonymously — we won&apos;t link them to your profile.
        </p>
      </section>

      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, marginBottom: 8 }}>Your rights</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          You can request deletion of your account and associated data at any time. Email
          privacy@faultline.app.
        </p>
      </section>
    </article>
  );
}
