import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Fault Line terms of service. Rules for using the community infrastructure reporting platform.',
};

const S = {
  section: { marginBottom: 28 } as const,
  h2: { fontSize: 20, fontWeight: 700, marginBottom: 8, marginTop: 28 } as const,
  p: { color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14, fontSize: 15 } as const,
  ul: { color: 'var(--text-secondary)', lineHeight: 1.8, paddingLeft: 20, marginBottom: 14, fontSize: 15 } as const,
};

export default function TermsPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 4 }}>Terms of Service</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: 14 }}>
        Last updated: March 2026
      </p>

      <section style={S.section}>
        <h2 style={S.h2}>1. Acceptance</h2>
        <p style={S.p}>
          By using Fault Line (&ldquo;the App&rdquo;), you agree to these terms. Fault Line
          is operated by Moonlit Social Labs. If you don&apos;t agree, don&apos;t use the App.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>2. What the App does</h2>
        <p style={S.p}>
          Fault Line allows users to report infrastructure issues in their community. Reports
          are aggregated, verified by the community, and escalated to responsible government
          authorities when thresholds are met. The app also provides accountability tools
          including legal demand letters, insurance claim evidence packages, fiscal impact
          projections, infrastructure health grades, and public transparency dashboards.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>3. User responsibilities</h2>
        <ul style={S.ul}>
          <li><strong>Accurate reporting:</strong> Submit truthful reports. Do not fabricate or exaggerate issues.</li>
          <li><strong>Appropriate content:</strong> Do not upload offensive, illegal, or irrelevant photos, videos, or descriptions.</li>
          <li><strong>No spam:</strong> Do not submit duplicate or frivolous reports to game the system.</li>
          <li><strong>No abuse:</strong> Do not harass other users or authorities.</li>
          <li><strong>Legal compliance:</strong> Follow all applicable local, state, and federal laws.</li>
          <li><strong>Legal tools:</strong> Demand letters and claim packages are informational templates, not legal advice. Consult an attorney for legal matters.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>4. Account</h2>
        <ul style={S.ul}>
          <li>You may use the App without an account (anonymous reporting).</li>
          <li>If you create an account, you are responsible for maintaining its security.</li>
          <li>We may suspend accounts that violate these terms.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>5. Content you submit</h2>
        <ul style={S.ul}>
          <li>You retain ownership of photos, videos, and descriptions you submit.</li>
          <li>
            By submitting a report, you grant Fault Line a non-exclusive, royalty-free license
            to use, display, and transmit your report content for the purpose of operating the
            service (including sharing with government authorities and displaying in public
            dashboards).
          </li>
          <li>Video testimonials may be referenced in escalation communications.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>6. Limitations</h2>
        <ul style={S.ul}>
          <li><strong>No guarantees:</strong> We do not guarantee any authority will acknowledge or fix a reported issue.</li>
          <li><strong>Not emergency services:</strong> Fault Line is NOT a replacement for 911. For immediate danger, call emergency services.</li>
          <li><strong>Not legal advice:</strong> Demand letters, fiscal projections, and claim packages are informational tools.</li>
          <li><strong>Availability:</strong> We strive for uptime but do not guarantee uninterrupted service.</li>
          <li><strong>AI analysis:</strong> Photo analysis and severity suggestions are automated estimates and may be incorrect.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>7. Ads &amp; rewards</h2>
        <p style={S.p}>
          The App displays banner advertisements to support free operation. Ad content is
          provided by third-party networks and does not constitute endorsement. Local business
          rewards are subject to participating businesses&apos; own terms.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>8. Public data</h2>
        <p style={S.p}>
          Infrastructure health scores, city rankings, aggregate statistics, and report maps
          are publicly available. By using the App, you understand your reports contribute to
          these public datasets in anonymized, aggregated form.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>9. Termination</h2>
        <p style={S.p}>
          We may suspend or terminate access for users who violate these terms. You may delete
          your account at any time.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>10. Liability</h2>
        <p style={S.p}>
          Fault Line is provided &ldquo;as is.&rdquo; Moonlit Social Labs is not liable for
          damages arising from use of the App, including vehicle damage, personal injury,
          property damage, legal outcomes, or any action or inaction by government authorities.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>11. Changes</h2>
        <p style={S.p}>
          We may update these terms. Continued use after changes constitutes acceptance.
        </p>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>12. Contact</h2>
        <p style={S.p}>
          Questions about these terms:<br />
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
