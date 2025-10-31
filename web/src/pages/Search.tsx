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
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Search failed');
      }
      
      // Handle both { tenders: [...] } and { count, tenders: [...] } formats
      const tenders = data.tenders || data || [];
      setResults(Array.isArray(tenders) ? tenders : []);
      
      if (tenders.length === 0) {
        setError('No tenders found. Try a different search term.');
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || String(err) || 'Failed to search. Make sure the API server is running on port 3001.');
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

      {error && (
        <div style={{ 
          color: error.includes('No tenders') ? '#666' : 'red', 
          marginBottom: 8, 
          padding: 12,
          backgroundColor: error.includes('No tenders') ? '#f5f5f5' : '#ffe6e6',
          borderRadius: 4
        }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ marginBottom: 8, padding: 12, color: '#666' }}>
          Recherche en cours... Cela peut prendre quelques secondes.
        </div>
      )}

      {results.length > 0 && (
        <div style={{ marginBottom: 8, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          {results.length} tender{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f2f2f2' }}>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Title</th>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Contract Name</th>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Reference</th>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Publication</th>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Deadline</th>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Budget</th>
                <th style={{ textAlign: 'left', padding: 8, border: '1px solid #ddd' }}>Link</th>
              </tr>
            </thead>
            <tbody>
              {results.map((t, i) => (
                <tr key={i} style={{ backgroundColor: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{t.title}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{t.contractName || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{t.reference || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{t.publicationDate || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{t.deadline || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>{t.budget || '-'}</td>
                  <td style={{ padding: 8, border: '1px solid #ddd' }}>
                    <a href={t.link} target="_blank" rel="noreferrer" style={{ color: '#0066cc' }}>Ouvrir</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


