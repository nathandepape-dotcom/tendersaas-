import React, { useState } from 'react';
import { Tenders } from './pages/Tenders';
import { Search } from './pages/Search';

export function App() {
  const [tab, setTab] = useState<'tenders' | 'search'>('tenders');

  return (
    <div style={{ fontFamily: 'system-ui, Arial, sans-serif', padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>TendersSaaS</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('tenders')} disabled={tab === 'tenders'}>Tenders</button>
        <button onClick={() => setTab('search')} disabled={tab === 'search'}>Search</button>
      </div>
      {tab === 'tenders' ? <Tenders /> : <Search />}
    </div>
  );
}


