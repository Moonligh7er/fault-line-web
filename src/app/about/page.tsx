export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <article style={{ maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 32, fontWeight: 900, marginBottom: 16 }}>About Fault Line</h1>
      <p style={{ fontSize: 18, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        Fault Line is a community infrastructure accountability platform. Report potholes,
        broken streetlights, and damaged public spaces in seconds. When enough neighbors
        report the same issue, authorities are notified automatically.
      </p>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
        We believe infrastructure transparency is a civic right. Your reports build the
        data that builds accountability.
      </p>
      <h2 style={{ fontSize: 22, marginTop: 24, marginBottom: 12 }}>How it works</h2>
      <ol style={{ marginLeft: 20, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
        <li>Spot an issue — pothole, broken light, fallen tree, etc.</li>
        <li>Submit a report with location, photo, and severity</li>
        <li>Neighbors upvote and confirm the issue</li>
        <li>Once verified, the responsible authority is notified</li>
        <li>Track progress from submission to resolution</li>
      </ol>
    </article>
  );
}
