import { TEDScraper } from './scraper';

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

      const scraper = new TEDScraper();
      try {
        const tenders = await scraper.search(query, scope);
        // export
        if (format === 'csv') {
          await scraper.exportToCSV(tenders);
        } else {
          await scraper.exportToJSON(tenders);
        }

        return new Response(JSON.stringify({ count: tenders.length, tenders }), {
          headers: { ...headers, 'content-type': 'application/json' },
        });
      } catch (err: any) {
        return new Response(JSON.stringify({ error: 'search_failed', message: String(err?.message ?? err) }), {
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


