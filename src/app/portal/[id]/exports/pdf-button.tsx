'use client';

import { useState } from 'react';
import type { CityDashboardData } from '@/lib/city';

export interface PdfData {
  city: string;
  dashboard: CityDashboardData;
  scorecard: { contractor: string; fixes: number; reopened: number; reopen_rate: number; median_days_to_fix: number | null }[];
  predeployment: { category: string; address: string | null; lat: number; lng: number; reports: number; years_recurring: number; priority: string }[];
}

const SEVERITY = ['extremely_dangerous', 'dangerous', 'significant', 'moderate', 'minor'];
const label = (s: string) => s.replace(/_/g, ' ');

export default function PdfButton({ data }: { data: PdfData }) {
  const [busy, setBusy] = useState(false);

  async function build() {
    setBusy(true);
    try {
      const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
      const doc = new jsPDF({ unit: 'pt', format: 'letter' });
      const d = data.dashboard;
      const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      let y = 56;
      doc.setFontSize(18);
      doc.text(`${data.city}: infrastructure report`, 48, y);
      doc.setFontSize(10);
      doc.text(`Generated ${today} from Fault Line resident reports (app.fault-line.dev). No reporter identities included.`, 48, (y += 18));

      const table = (title: string, head: string[], body: (string | number)[][]) => {
        doc.setFontSize(12);
        doc.text(title, 48, (y += 28));
        autoTable(doc, { startY: y + 6, head: [head], body, styles: { fontSize: 9 }, headStyles: { fillColor: [40, 40, 40] }, margin: { left: 48, right: 48 } });
        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
        if (y > 640) {
          doc.addPage();
          y = 40;
        }
      };

      table('Summary', ['Measure', 'Value'], [
        ['Open reports', d.totals.open],
        ['Severity-weighted backlog', d.weighted_backlog],
        ['New in the last 30 days', d.totals.last_30_days],
        ['Resolved (all time)', d.totals.resolved],
        ['Median days to resolve (12 months)', d.median_days_to_resolve ?? '—'],
        ['Escalations sent (90 days)', d.escalations_90d],
      ]);
      table('Open reports by severity', ['Severity', 'Open'], SEVERITY.map((s) => [label(s), d.open_by_severity[s] ?? 0]));
      table('By category', ['Category', 'Open', 'All time'], d.by_category.map((c) => [label(c.category), c.open, c.total]));
      table('By ZIP code', ['ZIP', 'Open', 'All time'], d.by_area.map((a) => [a.zip, a.open, a.total]));
      table('Last 12 months', ['Month', 'Reported', 'Resolved'], d.monthly.map((m) => [m.month, m.reported, m.resolved]));
      if (data.scorecard.length)
        table('Contractor recurrence (12 months; reopen = same issue within 25 m within 180 days)', ['Contractor', 'Fixes', 'Reopened', 'Rate', 'Median days'],
          data.scorecard.map((s) => [s.contractor, s.fixes, s.reopened, `${s.reopen_rate}%`, s.median_days_to_fix ?? '—']));
      if (data.predeployment.length)
        table('Likely to recur in the next three months', ['Priority', 'Category', 'Location', 'Reports', 'Years'],
          data.predeployment.slice(0, 40).map((p) => [p.priority, label(p.category), p.address ?? `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`, p.reports, p.years_recurring]));

      doc.save(`${data.city.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-fault-line-report.pdf`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-primary" onClick={build} disabled={busy || !data.dashboard}>
      {busy ? 'Building PDF…' : 'Download PDF'}
    </button>
  );
}
