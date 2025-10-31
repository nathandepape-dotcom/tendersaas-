import React, { useEffect, useMemo, useState } from 'react';

type HistoryRecord = {
  query: string;
  scope: string;
  resultsCount: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'success' | 'error' | 'running';
  exportFormat?: string;
  exportPath?: string;
  error?: string;
};

function parseNdjson(text: string): HistoryRecord[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

export function History() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/@fs/Users/nathandep/Documents/tenderssaas/search_history.ndjson')
      .then((r) => r.text())
      .then((text) => setRecords(parseNdjson(text)))
      .catch((e) => console.error('Failed to fetch search_history.ndjson', e));
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    const list = [...records].sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
    );
    if (!query) return list;
    return list.filter((r) =>
      [r.query, r.scope, r.status, r.exportFormat]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }, [records, q]);

  const avgDuration = useMemo(() => {
    const done = records.filter((r) => r.status === 'success');
    if (!done.length) return 0;
    return Math.round(done.reduce((s, r) => s + r.durationMs, 0) / done.length);
  }, [records]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <input
          placeholder="Filter history..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 8, flex: 1 }}
        />
        <div>Average: {avgDuration} ms</div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Started</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Query</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Scope</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Results</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Duration</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Status</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Export</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i}>
                <td style={{ padding: 8 }}>{new Date(r.startedAt).toLocaleString()}</td>
                <td style={{ padding: 8 }}>{r.query}</td>
                <td style={{ padding: 8 }}>{r.scope}</td>
                <td style={{ padding: 8 }}>{r.resultsCount}</td>
                <td style={{ padding: 8 }}>{r.durationMs} ms</td>
                <td style={{ padding: 8 }}>{r.status}</td>
                <td style={{ padding: 8 }}>
                  {r.exportPath ? (
                    <a href={`/${r.exportPath}`} target="_blank" rel="noreferrer">Open</a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


