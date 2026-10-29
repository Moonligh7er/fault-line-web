import { NextResponse } from 'next/server';
import { getCityPublic, thresholdsMet, THRESHOLD_LABELS } from '@/lib/city-public';

export const revalidate = 3600;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/**
 * Self-contained, script-free HTML card for city websites to iframe. Framing is
 * allowed only on /embed/* (middleware + next.config headers).
 */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const d = await getCityPublic(slug);
  if (!d) return new NextResponse('Not found', { status: 404 });
  const origin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? 'https://app.fault-line.dev';
  const rows = (Object.keys(d.thresholds) as (keyof typeof d.thresholds)[])
    .map((k) => `<li>${d.thresholds[k].have >= d.thresholds[k].need ? '&#10003;' : '&#9675;'} ${THRESHOLD_LABELS[k]}: ${d.thresholds[k].have} of ${d.thresholds[k].need}</li>`)
    .join('');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(d.name)} on Fault Line</title>
<style>body{margin:0;font:15px/1.5 system-ui,sans-serif;color:#1d1d1f;background:#fff}main{padding:16px}h1{font-size:18px;margin:0 0 4px}
.m{color:#555;font-size:13px}.n{font-size:28px;font-weight:800}ul{padding:0;list-style:none;margin:8px 0}a{color:#7a4b00}
@media (prefers-color-scheme:dark){body{background:#15171a;color:#eee}.m{color:#aaa}a{color:#f4b832}}</style></head>
<body><main><h1>${esc(d.name)}: reported infrastructure</h1>
<p class="m">Live from resident reports · methodology v${esc(d.methodology_version)}</p>
<p><span class="n">${d.inputs.open_backlog}</span> open reports · ${d.inputs.open_dangerous} dangerous or worse</p>
<p>Grade: <strong>${thresholdsMet(d) ? 'published weekly' : 'insufficient data'}</strong></p><ul>${rows}</ul>
<p class="m"><a href="${origin}/city/${esc(d.slug)}" target="_blank" rel="noopener">Full page on Fault Line</a></p></main></body></html>`;
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'public, max-age=600' } });
}
