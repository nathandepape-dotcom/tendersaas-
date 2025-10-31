import React, { useState } from 'react';

type Tender = {
  title: string;
  contractName?: string;
  link: string;
  reference?: string;
  publicationDate?: string;
  deadline?: string;
  budget?: string;
};

export function Search() {
  const [query, setQuery] = useState('ballistic vests');
  const [scope, setScope] = useState('ACTIVE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Tender[]>([]);

  async function runSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const url = new URL('http://localhost:3001/search');
      url.searchParams.set('query', query);
      url.searchParams.set('scope', scope);
      url.searchParams.set('format', 'json');
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setResults(data.tenders || []);
      try {
        // Signal other tabs/components to refresh (Tenders recent list)
        localStorage.setItem('search-updated', String(Date.now()));
      } catch {}
    } catch (err: any) {
      setError(String(err?.message ?? err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={runSearch} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search query..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ padding: 8, flex: 1 }}
        />
        <select value={scope} onChange={(e) => setScope(e.target.value)} style={{ padding: 8 }}>
          <option value="ACTIVE">ACTIVE</option>
          <option value="AWARD">AWARD</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Title</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Contract Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Reference</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Publication</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Deadline</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Budget</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Link</th>
            </tr>
          </thead>
          <tbody>
            {results.map((t, i) => (
              <tr key={i}>
                <td style={{ padding: 8 }}>{t.title}</td>
                <td style={{ padding: 8 }}>{t.contractName || ''}</td>
                <td style={{ padding: 8 }}>{t.reference || ''}</td>
                <td style={{ padding: 8 }}>{t.publicationDate || ''}</td>
                <td style={{ padding: 8 }}>{t.deadline || ''}</td>
                <td style={{ padding: 8 }}>{t.budget || ''}</td>
                <td style={{ padding: 8 }}>
                  <a href={t.link} target="_blank" rel="noreferrer">Open</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


