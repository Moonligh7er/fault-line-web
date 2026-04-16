import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Fault Line privacy policy. What we collect, how we use it, and how we protect your data. We never sell personal information.',
};

const S = {
  section: { marginBottom: 28 } as const,
  h2: { fontSize: 20, fontWeight: 700, marginBottom: 8, marginTop: 28 } as const,
  h3: { fontSize: 17, fontWeight: 600, marginBottom: 6, marginTop: 16 } as const,
  p: { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14, fontSize: 15 } as const,
  ul: { color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, marginBottom: 14, fontSize: 15 } as const,
};

export default function PrivacyPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Privacy Policy</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
        Last updated: March 2026
      </p>

      <p style={S.p}>
        Fault Line (&ldquo;the App&rdquo;) is a community infrastructure reporting platform
        operated by Moonlit Social Labs. This policy explains what data we collect, why, and
        how we protect it.
      </p>

      <section style={S.section}>
        <h2 style={S.h2}>1. Data we collect</h2>
        <h3 style={S.h3}>Information you provide</h3>
        <ul style={S.ul}>
          <li><strong>Account information:</strong> Email address (if you create an account). You may also report anonymously.</li>
          <li><strong>Reports:</strong> Category, description, severity ratings, and photos/videos you attach.</li>
          <li><strong>Votes:</strong> Upvotes and confirmations on community reports.</li>
          <li><strong>Feedback:</strong> Messages submitted via the feedback form.</li>
        </ul>
        <h3 style={S.h3}>Information collected automatically</h3>
        <ul style={S.ul}>
          <li><strong>Location:</strong> GPS coordinates when you submit a report. We only access location during active reporting or when you opt into proximity alerts.</li>
          <li><strong>Device info:</strong> Device model, OS version, and app version for crash reporting and compatibility.</li>
          <li><strong>Analytics:</strong> Anonymous, aggregate usage via Google Analytics with IP anonymization enabled.</li>
        </ul>
        <h3 style={S.h3}>Information we do NOT collect</h3>
        <ul style={S.ul}>
          <li>We do not track your location in the background without explicit opt-in.</li>
          <li>We do not sell your personal data to third parties.</li>
          <li>We do not collect contacts, browsing history, or data from other apps.</li>
          <li>We do not store passwords &mdash; we use magic-link authentication.</li>
          <li>We do not use behavioral or personalized advertising.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>2. How we use your data</h2>
        <ul style={S.ul}>
          <li><strong>Reports:</strong> To document issues, identify responsible authorities, and escalate confirmed problems.</li>
          <li><strong>Community verification:</strong> To aggregate reports and confirm real issues.</li>
          <li><strong>Authority escalation:</strong> Aggregated, anonymized report data is shared with authorities. Your name and email are never included.</li>
          <li><strong>Legal tools:</strong> Demand letters and insurance packages are generated locally and shared only when you choose.</li>
          <li><strong>Analytics:</strong> Aggregate data powers infrastructure health scores and public dashboards.</li>
          <li><strong>Crash reporting:</strong> Anonymized crash data via Sentry for bug fixes.</li>
          <li><strong>Ads:</strong> Banner advertisements via Google AdMob / AdSense. No personalized ads.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>3. Data sharing</h2>
        <p style={S.p}>We share data only in these circumstances:</p>
        <ul style={S.ul}>
          <li><strong>Government authorities:</strong> Aggregated, anonymized report data during escalation. Your identity is never included.</li>
          <li><strong>Public dashboards:</strong> Infrastructure health scores and aggregate statistics. No individual user data exposed.</li>
          <li><strong>Crash reporting:</strong> Anonymized crash data with Sentry.</li>
          <li><strong>Ad networks:</strong> Standard ad requests to Google AdMob/AdSense. No personal data shared.</li>
          <li><strong>Legal:</strong> If required by law or to protect safety.</li>
        </ul>
        <p style={{ ...S.p, fontWeight: 600, color: 'var(--text)' }}>
          We never sell your personal data.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>4. Cookies</h2>
        <p style={S.p}>
          We use essential, httpOnly, same-site cookies for authentication session management.
          We use Google Analytics with IP anonymization for aggregate usage data. No
          third-party tracking cookies.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>5. Data storage &amp; security</h2>
        <ul style={S.ul}>
          <li>Data is stored on Supabase (hosted on AWS) with encryption at rest and in transit.</li>
          <li>Row-level security ensures users can only modify their own data.</li>
          <li>Server-side rate limiting protects against abuse.</li>
          <li>CSP nonces, CSRF guards, and httpOnly cookies protect the web app.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>6. Anonymous reports</h2>
        <p style={S.p}>
          You can submit reports without creating an account. Anonymous reports are never
          linked to any user profile &mdash; not even in our database.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>7. Your rights</h2>
        <ul style={S.ul}>
          <li><strong>Access:</strong> View all your reports and profile data in the app.</li>
          <li><strong>Delete:</strong> Request deletion of your account and all associated data.</li>
          <li><strong>Anonymous reporting:</strong> Use the app without creating an account.</li>
          <li><strong>Opt-out:</strong> Deny tracking prompts. Disable proximity alerts in settings.</li>
          <li><strong>Data portability:</strong> Request an export of your data.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>8. Children&apos;s privacy</h2>
        <p style={S.p}>
          Fault Line is not directed at children under 13. We do not knowingly collect data
          from children.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>9. Changes</h2>
        <p style={S.p}>
          We may update this policy. Changes will be posted in the app and on this page.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>10. Contact</h2>
        <p style={S.p}>
          For privacy questions or data deletion requests:<br />
          <a href="mailto:moonlit-social-labs@proton.me">moonlit-social-labs@proton.me</a>
          <br />
          <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
            Michael Wylde &middot; Moonlit Social Labs
          </span>
        </p>
      </section>
    </article>
  );
}
