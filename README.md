# TED Scraper

A web scraper for TED (Tenders Electronic Daily) using TypeScript and Bun.

## Features

- Search for tenders on the TED website
- Extract tender information (title, link, dates, buyer, description)
- Export results to JSON or CSV format
- Type-safe implementation with TypeScript
- Fast execution with Bun runtime

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

### Basic search

```bash
bun run src/scraper.ts
```

This will search for "ballistic vests" with the scope "ACTIVE" and export to JSON.

### Custom search query

```bash
bun run src/scraper.ts "your search term" "ACTIVE" "json"
```

Arguments:
1. Search query (required)
2. Scope - ACTIVE, AWARD, etc. (default: ACTIVE)
3. Export format - json or csv (default: json)

### Examples

```bash
# Search for ballistic vests (default)
bun run src/scraper.ts

# Search for construction equipment
bun run src/scraper.ts "construction equipment" "ACTIVE"

# Export to CSV
bun run src/scraper.ts "ballistic vests" "ACTIVE" "csv"
```

## Output

Results are saved to:
- `tenders.json` - JSON format
- `tenders.csv` - CSV format

## Important Notes

⚠️ **Note:** Web scraping selectors may need adjustment based on the actual HTML structure of the TED website. If you encounter issues:

1. Inspect the actual HTML structure of the search results page
2. Update the selectors in `src/scraper.ts` to match the current HTML structure
3. Adjust the `$('.search-result-item')` selectors and related elements

## Structure

```
tenderssaas/
├── src/
│   └── scraper.ts       # Main scraper implementation
├── package.json          # Project dependencies
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



