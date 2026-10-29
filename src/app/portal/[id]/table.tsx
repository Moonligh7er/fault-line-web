import type { ReactNode } from 'react';

export default function Table({ head, rows }: { head: string[]; rows: (string | number | ReactNode)[][] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} style={{ padding: '6px 8px', borderBottom: '1px solid var(--border)' }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
