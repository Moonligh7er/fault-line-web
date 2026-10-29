import { TIERS, formatDate, formatUsd, cityPriceCents, CITY_TERMS_VERSION, type CityAccount } from '@/lib/city';

/**
 * The up-front notice every city sees before its dashboard opens. The same
 * points are in section 12 of /terms; this is the version tied to the account.
 */
export default function CityTerms({ city }: { city: CityAccount }) {
  const price = formatUsd(cityPriceCents(city));
  const tier = TIERS[city.tier];
  const li = { marginBottom: 8 } as const;
  return (
    <div style={{ lineHeight: 1.65, fontSize: 15 }}>
      <p style={{ marginBottom: 12, color: 'var(--text-muted)', fontSize: 13 }}>City Terms, version {CITY_TERMS_VERSION}</p>
      <ul style={{ paddingLeft: 20 }}>
        {city.fee_waived ? (
          <li style={li}>
            <strong>No fee.</strong> Fault Line has waived the subscription fee for {city.display_name}. If the waiver
            ever ends, we will tell you in writing at least 60 days before any invoice, and nothing renews unless your
            account owner turns renewal on.
          </li>
        ) : (
          <>
            <li style={li}>
              <strong>Pilot: free until {formatDate(city.pilot_ends_at)}.</strong> No invoice is sent during the pilot.
            </li>
            <li style={li}>
              <strong>After the pilot, keeping dashboard access requires a subscription</strong>: the {tier.label} plan
              ({tier.population}) at <strong>{price} per year</strong>, billed annually. That price is locked for your
              city for as long as it keeps renewing; any change gets at least 60 days&apos; written notice before the
              renewal it affects.
            </li>
            <li style={li}>
              <strong>You choose whether it renews automatically</strong>, below, and can change that choice at any time
              under Plan &amp; billing. A change applies to the next renewal.
            </li>
            <li style={li}>
              <strong>If renewal is on</strong>, an invoice is emailed when the pilot or term ends, due in 30 days
              (bank transfer, ACH or card; purchase-order numbers go on the invoice). If it isn&apos;t paid by the due
              date, dashboard access is suspended until it is paid. <strong>If renewal is off</strong>, access simply
              ends at the end of the pilot or term and nothing is billed.
            </li>
            <li style={li}>
              <strong>Reminders</strong> are emailed to the account owner and billing contact 60, 30 and 7 days before
              the pilot or term ends, saying what will happen and how to change it.
            </li>
            <li style={li}>
              <strong>Non-appropriation.</strong> If your governing body does not appropriate funds for a renewal, turn
              renewal off or tell us in writing before the term ends and the subscription ends with no further charge.
            </li>
          </>
        )}
        <li style={li}>
          <strong>What payment never changes:</strong> grades follow the published methodology, reporter identities
          stay private, and the public backlog stays public. Your city can dispute inputs; it cannot buy a grade.
        </li>
        <li style={li}>
          <strong>Refunds:</strong> annual fees aren&apos;t prorated or refunded for a term already started, except where
          the law requires it or we materially fail to provide the dashboard.
        </li>
        <li style={li}>
          <strong>Leaving:</strong> you can export all of your city&apos;s reports and analytics (CSV) at any time while
          access is open, and on request within 60 days after it ends.
        </li>
        <li style={li}>
          These terms are section 12 of the <a href="/terms#city-accounts">Terms of Service</a> and add to the rest of it and the{' '}
          <a href="/privacy">Privacy Policy</a>. A signed pilot agreement or purchase order, where you have one, takes
          precedence.
        </li>
      </ul>
    </div>
  );
}
