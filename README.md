# TED Scraper

A web scraper for TED (Tenders Electronic Daily) using TypeScript and Bun, with a React frontend and API server.

## Features

- 🔍 Search for tenders on the TED website
- 📊 Extract tender information (title, reference, contract name, deadline, budget, publication date)
- 🌐 React-based web interface for searching and viewing tenders
- 🚀 REST API server built with Bun
- 💾 Export results to JSON or CSV format
- 📦 Type-safe implementation with TypeScript
- ⚡ Fast execution with Bun runtime

## Installation

First, make sure you have [Bun](https://bun.sh/) installed:

```bash
curl -fsSL https://bun.sh/install | bash
```

Then install dependencies:

```bash
bun install
```

## Usage

### Web Interface (Recommended)

1. Start the API server:
```bash
bun run api
```

2. Start the frontend (in a new terminal):
```bash
cd web
bun install
bun run dev
```

3. Open your browser to `http://localhost:5173` (or the port shown by Vite)

### Command Line

#### Basic search

```bash
bun run src/scraper.ts
```

This will search for "ballistic vests" with the scope "ACTIVE" and export to JSON.

#### Custom search query

```bash
bun run src/scraper.ts "your search term" "ACTIVE" "json"
```

Arguments:
1. Search query (required)
2. Scope - ACTIVE, AWARD, ALL (default: ACTIVE)
3. Export format - json or csv (default: json)

#### Examples

```bash
# Search for ballistic vests (default)
bun run src/scraper.ts

# Search for construction equipment
bun run src/scraper.ts "construction equipment" "ACTIVE"

# Export to CSV
bun run src/scraper.ts "ballistic vests" "ACTIVE" "csv"
```

### API Endpoints

The API server runs on `http://localhost:3001` by default:

- `GET /health` - Health check
- `GET /search?query=YOUR_QUERY&scope=ACTIVE` - Search for tenders

## Output

Results are saved to:
- `tenders.json` - JSON format (default)
- `tenders.csv` - CSV format

Each tender includes:
- `title` - Main tender title
- `reference` - Notice reference number
- `contractName` - Contract name
- `link` - Full URL to the tender
- `publicationDate` - Publication date
- `deadline` - Application deadline
- `budget` - Estimated budget

## Important Notes

⚠️ **Note:** Web scraping selectors may need adjustment based on the actual HTML structure of the TED website. If you encounter issues:

1. Inspect the actual HTML structure of the search results page
2. Update the selectors in `src/scraper.ts` to match the current HTML structure
3. Adjust the `$('.search-result-item')` selectors and related elements

## Project Structure

```
tenderssaas/
├── src/
│   ├── scraper.ts       # Main scraper implementation (Playwright + Cheerio)
│   └── api.ts           # Bun API server
├── web/                 # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Search.tsx    # Search interface
│   │   │   └── Tenders.tsx   # Tenders table view
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── package.json          # Backend dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## Legal Considerations

Make sure to:
- Respect the website's robots.txt
- Follow their terms of service
- Don't overload the server with requests
- Use the data responsibly

## License

MIT



