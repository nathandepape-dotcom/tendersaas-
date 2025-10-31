import React, { useEffect, useMemo, useState } from 'react';

type Tender = {
  title: string;
  contractName?: string;
  link: string;
  reference?: string;
  publicationDate?: string;
  deadline?: string;
  budget?: string;
};

export function Tenders() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch('/@fs/Users/nathandep/Documents/tenderssaas/tenders.json');
        setTenders(await r.json());
      } catch (e) {
        console.error('Failed to fetch tenders.json', e);
      }
    };

    load();

    const onStorage = (e: StorageEvent) => {
      if (e.key === 'search-updated') {
        load();
      }
    };
    window.addEventListener('storage', onStorage);
    const interval = window.setInterval(load, 3000);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.clearInterval(interval);
    };
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return tenders;
    return tenders.filter((t) =>
      [t.title, t.contractName, t.reference, t.budget]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(query))
    );
  }, [tenders, q]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          placeholder="Search tenders..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          style={{ padding: 8, flex: 1 }}
        />
        <a href="/tenders.csv" target="_blank" rel="noreferrer">
          <button>Open CSV</button>
        </a>
      </div>

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
            {filtered.map((t, i) => (
              <tr key={i}>
                <td style={{ padding: 8 }}>{t.title}</td>
                <td style={{ padding: 8 }}>{t.contractName || ''}</td>
                <td style={{ padding: 8 }}>{t.reference || ''}</td>
                <td style={{ padding: 8 }}>{t.publicationDate || ''}</td>
                <td style={{ padding: 8 }}>{t.deadline || ''}</td>
                <td style={{ padding: 8 }}>{t.budget || ''}</td>
                <td style={{ padding: 8 }}>
                  <a href={t.link} target="_blank" rel="noreferrer">
                    Open
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


