import { TEDScraper } from './scraper';
import { writeFile, appendFile } from 'fs/promises';

type SearchHistoryRecord = {
  query: string;
  scope: string;
  resultsCount: number;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  status: 'success' | 'error';
  exportFormat?: string;
  exportPath?: string;
  error?: string;
};

async function logSearch(record: SearchHistoryRecord, file = 'search_history.ndjson'): Promise<void> {
  await appendFile(file, JSON.stringify(record) + '\n', 'utf-8');
}

export const server = Bun.serve({
  port: 3001,
  fetch: async (req) => {
    const url = new URL(req.url);
    const headers = {
      'access-control-allow-origin': '*',
      'access-control-allow-headers': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
    } as Record<string, string>;

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    if (url.pathname === '/search' && req.method === 'GET') {
      const query = url.searchParams.get('query') || 'ballistic vests';
      const scope = url.searchParams.get('scope') || 'ACTIVE';
      const format = url.searchParams.get('format') || 'json';

      const startedAt = Date.now();
      const scraper = new TEDScraper();
      try {
        const tenders = await scraper.search(query, scope);
        // export
        if (format === 'csv') {
          await scraper.exportToCSV(tenders);
        } else {
          await scraper.exportToJSON(tenders);
        }

        await logSearch({
          query,
          scope,
          resultsCount: tenders.length,
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          status: 'success',
          exportFormat: format,
          exportPath: format === 'csv' ? 'tenders.csv' : 'tenders.json',
        });

        return new Response(JSON.stringify({ count: tenders.length, tenders }), {
          headers: { ...headers, 'content-type': 'application/json' },
        });
      } catch (err: any) {
        await logSearch({
          query,
          scope,
          resultsCount: 0,
          startedAt: new Date(startedAt).toISOString(),
          finishedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          status: 'error',
          exportFormat: format,
          error: String(err?.message ?? err),
        });
        return new Response(JSON.stringify({ error: 'search_failed' }), {
          status: 500,
          headers: { ...headers, 'content-type': 'application/json' },
        });
      }
    }

    if (url.pathname === '/health') {
      return new Response('ok', { headers });
    }

    return new Response('Not found', { status: 404, headers });
  },
});

console.log(`API server running on http://localhost:${server.port}`);


