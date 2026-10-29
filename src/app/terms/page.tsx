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
        Last updated: October 29, 2026
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

      <section style={S.section} id="city-accounts">
        <h2 style={S.h2}>12. City accounts (paid city dashboard)</h2>
        <ul style={S.ul}>
            <li><strong>Who this covers.</strong> A city account is the paid city-side dashboard for a government body (a town, city, county, regional or state agency). The person who accepts these terms for an account confirms they are authorized to do so for that body. Residents never pay; the citizen app stays free.</li>
            <li><strong>Pilot.</strong> A city account starts with a free pilot that runs until the pilot end date shown in the account. No invoice is sent during a pilot.</li>
            <li><strong>Fee waivers.</strong> Fault Line may waive the fee for a city, in writing, before or during its pilot. While a waiver stands no invoice is sent. If a waiver is removed, automatic renewal is off until the account owner turns it on, and we give at least 60 days&rsquo; written notice before any invoice.</li>
            <li><strong>After the pilot.</strong> Keeping dashboard access after the pilot requires a subscription at the published annual price for the city&rsquo;s tier: Town (under 50,000 residents) $6,000; City (50,000&ndash;250,000) $9,600; Regional (250,000&ndash;1 million) $30,000; Metro and state agencies by written quote. A city&rsquo;s price is locked at the price published on the day its owner accepts these terms, for as long as it keeps renewing. Any change gets at least 60 days&rsquo; written notice before the renewal it affects.</li>
            <li><strong>Automatic renewal is your choice.</strong> The account owner chooses, with nothing pre-selected, whether the subscription renews automatically, and can change that choice at any time in the portal (Plan &amp; billing). A change applies to the next renewal. If renewal is on, an annual invoice is emailed when the pilot or term ends, due in 30 days. If renewal is off, dashboard access ends at the end of the pilot or term and nothing is billed. Subscribing again later is always possible.</li>
            <li><strong>Reminders and notices.</strong> We email the account owner and billing contact 60, 30 and 7 days before a pilot or term ends, saying what will happen and how to change it, and we send written notice of every renewal change, invoice, suspension and end of access. A copy of the accepted terms is emailed when they are accepted, and every acceptance and change is kept in the account history.</li>
            <li><strong>Invoices and payment.</strong> Invoices are issued and processed by our payment provider, Stripe, and can be paid by bank transfer, ACH or card; a purchase-order number can be printed on each invoice. Government customers are invoiced as tax-exempt. Fault Line never sees or stores card or bank details.</li>
            <li><strong>Non-payment.</strong> If an invoice is not paid by its due date, dashboard access is suspended until it is paid; it reopens automatically on payment. Public city pages and resident reports are never affected by payment status.</li>
            <li><strong>Non-appropriation.</strong> If a city&rsquo;s governing body does not appropriate funds for a renewal, the city may end the subscription with no further charge by turning renewal off, or telling us in writing, before the term ends.</li>
            <li><strong>Refunds.</strong> Annual fees are not prorated or refunded for a term that has already started, except where the law requires it or where Fault Line materially fails to provide the dashboard. Turning renewal off mid-term keeps access open to the end of the paid term.</li>
            <li><strong>What payment never changes.</strong> Grades follow the published methodology, reporter identities stay private, and the public backlog stays public. Cities can dispute inputs and get corrections applied; they cannot pay to change, delay or suppress a grade.</li>
            <li><strong>Your data when you leave.</strong> A city can export all of its reports and analytics (CSV) at any time while access is open, and on request within 60 days after it ends.</li>
            <li><strong>Precedence.</strong> A signed pilot agreement, contract or purchase order between Fault Line and a city takes precedence over this section where they differ.</li>
        </ul>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>13. Contact</h2>
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
