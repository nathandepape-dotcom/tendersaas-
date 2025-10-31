import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { writeFile } from 'fs/promises';
import { join } from 'path';

interface TenderData {
  title: string;
  link: string;
  publicationDate?: string;
  deadline?: string;
  buyer?: string;
  description?: string;
  reference?: string;
  budget?: string;
  contractName?: string;
}

class TEDScraper {
  private baseUrl = 'https://ted.europa.eu';

  async search(query: string, scope: string = 'ACTIVE'): Promise<TenderData[]> {
    const browser = await chromium.launch({ headless: true });
    
    try {
      console.log(`Searching for: "${query}" with scope: ${scope}...`);
      
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1920, height: 1080 });
      
      // Intercept network requests to find API endpoints
      const apiResponses: any[] = [];
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('search') || url.includes('result') || url.includes('api')) {
          try {
            const contentType = response.headers()['content-type'] || '';
            if (contentType.includes('json') || contentType.includes('text/html')) {
              const body = await response.text().catch(() => '');
              if (body.length > 0) {
                apiResponses.push({ url, body: body.substring(0, 1000) });
              }
            }
          } catch (e) {
            // Ignore errors
          }
        }
      });
      
      // Navigate to search results
      const searchUrl = `${this.baseUrl}/en/search/result?FT=${encodeURIComponent(query)}&scope=${scope}&simpleSearchRef=true`;
      console.log(`Fetching: ${searchUrl}`);
      
      await page.goto(searchUrl, { 
        waitUntil: 'networkidle',
        timeout: 60000 
      });

      // Wait for search results to load - try waiting for common elements
      console.log('Waiting for results to load...');
      
      try {
        // Wait for either results or "no results" message
        await Promise.race([
          page.waitForSelector('a[href*="/notification/"]', { timeout: 10000 }).catch(() => null),
          page.waitForSelector('.search-results', { timeout: 10000 }).catch(() => null),
          page.waitForSelector('[id*="search"]', { timeout: 10000 }).catch(() => null),
          page.waitForTimeout(8000)
        ]);
      } catch (e) {
        // Continue anyway
      }
      
      // Additional wait for dynamic content
      await page.waitForTimeout(3000);
      
      // Wait for potential dynamic loading - scroll to trigger lazy loading
      await page.evaluate(() => {
        // @ts-ignore - window and document are available in browser context
        window.scrollTo(0, document.body.scrollHeight);
      });
      await page.waitForTimeout(2000);
      
      // Get page content after JavaScript execution
      const html = await page.content();
      
      // Save HTML for debugging if no results found
      if (process.env.DEBUG) {
        await writeFile('debug_page.html', html, 'utf-8');
        console.log('Saved page HTML to debug_page.html for inspection');
        if (apiResponses.length > 0) {
          console.log(`Intercepted ${apiResponses.length} API responses`);
        }
      }
      
      await browser.close();
      
      const $ = cheerio.load(html);
      const tenders: TenderData[] = [];
      
      // Strategy 1: Look for notice detail links (TED uses /en/notice/-/detail/ format)
      const noticeLinks = $('a[href*="/notice/-/detail/"]');
      if (noticeLinks.length > 0) {
        console.log(`Found ${noticeLinks.length} notice links`);
        
        noticeLinks.each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href') || '';
          if (!href) return;
          
          let fullLink = href;
          if (!href.startsWith('http')) {
            fullLink = `${this.baseUrl}${href}`;
          }
          
          // Get reference number from link text or href (format: 576477-2025)
          let reference = $link.text().trim();
          
          // If reference is empty, try to extract from href
          if (!reference && href.includes('/detail/')) {
            const match = href.match(/(\d+-\d+)/);
            if (match) {
              reference = match[1];
            }
          }
          
          // Find parent row to get title and other details
          const $row = $link.closest('tr, div, li, article').first();
          let title = '';
          let deadline = '';
          let publicationDate = '';
          let budget = '';
          
          if ($row.length > 0) {
            // Try to get title from various selectors
            title = $row.find('h1, h2, h3, .title, [class*="title"]').first().text().trim();
            
            // If still no title, try the original selectors
            if (!title) {
              // Title is in the list item with class containing "evkt30" - get ALL text from all spans
              const $titleContainer = $row.find('li.css-1evkt30, li[class*="evkt"]').first();
              if ($titleContainer.length > 0) {
                // Get all text from all child spans and combine them
                title = $titleContainer.find('span').map((i, span) => $(span).text()).get().join('').trim();
              }
              
              // If still no title, try finding text with "span" that contains the description
              if (!title) {
                const $spans = $row.find('li[class*="evkt"] span');
                title = $spans.map((i, span) => $(span).text()).get().join('').trim();
              }
              
              // Last resort: get first span with u0hsu5 class
              if (!title) {
                title = $row.find('span.css-u0hsu5, span[class*="u0hsu5"]').first().text().trim();
              }
            }
            
            // Extract deadline from the last column (deadline cell)
            const $deadlineCell = $row.find('p.css-hby6y0 span.css-v9egcd.ed8fupw1, p.css-hby6y0 span[class*="ed8fupw1"]');
            if ($deadlineCell.length > 0) {
              deadline = $deadlineCell.text().trim();
            }
            
            // Extract publication date
            const $pubDateCell = $row.find('li.css-v9egcd.ed8fupw2 span, li[class*="ed8fupw2"] span');
            if ($pubDateCell.length > 0) {
              publicationDate = $pubDateCell.first().text().trim();
            }
            
            // Try to find budget/amount information - check row text for currency patterns
            const rowText = $row.text();
            const budgetMatch = rowText.match(/(?:€|EUR|EURO)\s*(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)|(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)\s*(?:€|EUR|EURO)/i);
            if (budgetMatch) {
              budget = budgetMatch[0];
            }
          }
          
          // Use reference as fallback title if no title found
          if (!title && reference) {
            title = reference;
          }
          
          // Only push when we have a link (title is optional but preferred)
          if (fullLink) {
            tenders.push({
              title: title || reference || 'Untitled Tender',
              link: fullLink,
              reference: reference || undefined,
              deadline: deadline || undefined,
              publicationDate: publicationDate || undefined,
              budget: budget || undefined,
              contractName: title || reference || undefined,
            });
          }
        });
      }
      
      // Strategy 1b: Look for links to notification pages (fallback)
      const notificationLinks = $('a[href*="/notification/"]');
      if (notificationLinks.length > 0 && tenders.length === 0) {
        console.log(`Found ${notificationLinks.length} notification links`);
        
        notificationLinks.each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href') || '';
          if (!href) return;
          
          let fullLink = href;
          if (!href.startsWith('http')) {
            fullLink = `${this.baseUrl}${href}`;
          }
          
          // Get title from link text or parent
          let title = $link.text().trim();
          if (!title) {
            title = $link.closest('div, li, article').find('h1, h2, h3, .title').first().text().trim();
          }
          if (!title) {
            title = $link.closest('div, li, article').text().trim().substring(0, 200);
          }
          
          // Extract reference number if present
          const reference = $link.closest('div, li, article').text().match(/[0-9]{4}\/S [0-9]{3}-[0-9]{6,}/)?.[0] || 
                           $link.text().match(/[0-9]{4}\/S [0-9]{3}-[0-9]{6,}/)?.[0] || '';
          
          if (title && fullLink) {
            tenders.push({
              title: title,
              link: fullLink,
              reference: reference,
              contractName: title,
            });
          }
        });
      }
      
      // Strategy 2: Extract from table rows (TED uses Material-UI tables)
      if (tenders.length === 0) {
        const tableRows = $('tr.CustomReactClasses-MuiTableRow-root');
        if (tableRows.length > 0) {
          console.log(`Found ${tableRows.length} table rows`);
          
          tableRows.each((index, element) => {
            const $row = $(element);
            const $link = $row.find('a[href*="/notice/-/detail/"], a[href*="/notification/"]').first();
            
            if ($link.length === 0) return;
            
            const href = $link.attr('href') || '';
            if (!href) return;
            
            let fullLink = href;
            if (!href.startsWith('http')) {
              fullLink = `${this.baseUrl}${href}`;
            }
            
            const reference = $link.text().trim();
            
            // Extract title from various possible locations - get ALL text from spans
            const $titleContainer = $row.find('li.css-1evkt30, li[class*="evkt"]').first();
            let title = '';
            
            if ($titleContainer.length > 0) {
              // Combine all spans in the title container
              title = $titleContainer.find('span').map((i, span) => $(span).text()).get().join('').trim();
            }
            
            // Fallback options
            if (!title) {
              const $spans = $row.find('li[class*="evkt"] span');
              title = $spans.map((i, span) => $(span).text()).get().join('').trim();
            }
            
            if (!title) {
              title = $row.find('span.css-u0hsu5').first().text().trim();
            }
            
            if (!title) {
              title = $row.text().trim().substring(0, 200);
            }
            
            // Clean up title - remove extra whitespace
            title = title.replace(/\s+/g, ' ').trim();
            
          if (title && fullLink) {
              tenders.push({
                title: title || 'Untitled Tender',
                link: fullLink,
                reference: reference,
                contractName: title || undefined,
              });
            }
          });
        }
      }
      
      // Strategy 3: Try common result container selectors
      if (tenders.length === 0) {
        const selectors = [
          '.tedv2',
          '[class*="result"]',
          '[class*="notification"]',
          '[id*="search-result"]',
          'article',
          '.list-item'
        ];
        
        for (const selector of selectors) {
          const elements = $(selector);
          if (elements.length > 0) {
            console.log(`Trying selector: ${selector} (${elements.length} elements)`);
            
            elements.each((index, element) => {
              const $element = $(element);
              const linkElement = $element.find('a[href*="/notification/"], a[href*="notification"]').first();
              
              if (linkElement.length === 0) return;
              
              const href = linkElement.attr('href') || '';
              let fullLink = href;
              if (href && !href.startsWith('http')) {
                fullLink = `${this.baseUrl}${href}`;
              }
              
              const title = linkElement.text().trim() || 
                           $element.find('h1, h2, h3, .title').first().text().trim() ||
                           $element.text().trim().substring(0, 200);
              
              const reference = $element.text().match(/[0-9]{4}\/S [0-9]{3}-[0-9]{6,}/)?.[0] || '';
              
              if (fullLink && !tenders.some(t => t.link === fullLink)) {
                tenders.push({
                  title: title || 'Untitled Tender',
                  link: fullLink,
                  reference: reference,
                  contractName: title || undefined,
                });
              }
            });
            
            if (tenders.length > 0) break;
          }
        }
      }
      
      // Strategy 4: Extract all links with notice or notification in URL and any text content
      if (tenders.length === 0) {
        const allLinks = $('a[href]');
        const notificationRelatedLinks: Array<{link: string, text: string}> = [];
        
        allLinks.each((index, element) => {
          const $link = $(element);
          const href = $link.attr('href') || '';
          const text = $link.text().trim();
          
          if (href.includes('notification') && text.length > 10) {
            let fullLink = href;
            if (!href.startsWith('http')) {
              fullLink = `${this.baseUrl}${href}`;
            }
            notificationRelatedLinks.push({ link: fullLink, text });
          }
        });
        
        if (notificationRelatedLinks.length > 0) {
          console.log(`Found ${notificationRelatedLinks.length} notification-related links`);
          notificationRelatedLinks.forEach(({ link, text }) => {
            const reference = text.match(/[0-9]{4}\/S [0-9]{3}-[0-9]{6,}/)?.[0] || '';
            tenders.push({
                  title: text || 'Untitled Tender',
              link: link,
                  reference: reference,
                  contractName: (text || undefined),
            });
          });
        }
      }
      
      // Remove duplicates
      const uniqueTenders = tenders.filter((tender, index, self) =>
        index === self.findIndex(t => t.link === tender.link)
      );
      
      console.log(`Found ${uniqueTenders.length} unique tenders`);
      return uniqueTenders;
      
    } catch (error) {
      await browser.close();
      console.error('Error scraping TED website:', error);
      throw error;
    }
  }

  async exportToJSON(data: TenderData[], filename: string = 'tenders.json'): Promise<void> {
    const outputPath = join(process.cwd(), filename);
    await writeFile(outputPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Data exported to: ${outputPath}`);
  }

  async exportToCSV(data: TenderData[], filename: string = 'tenders.csv'): Promise<void> {
    const headers = ['Title', 'Contract Name', 'Link', 'Reference', 'Publication Date', 'Deadline', 'Budget'];
    
    const csvRows = [
      headers.join(','),
      ...data.map(tender => [
        this.escapeCSV(tender.title),
        this.escapeCSV(tender.contractName || ''),
        this.escapeCSV(tender.link),
        this.escapeCSV(tender.reference || ''),
        this.escapeCSV(tender.publicationDate || ''),
        this.escapeCSV(tender.deadline || ''),
        this.escapeCSV(tender.budget || ''),
      ].join(','))
    ];

    const outputPath = join(process.cwd(), filename);
    await writeFile(outputPath, csvRows.join('\n'), 'utf-8');
    console.log(`Data exported to: ${outputPath}`);
  }

  private escapeCSV(value: string): string {
    if (!value) return '';
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const query = args[0] || 'ballistic vests';
  const scope = args[1] || 'ACTIVE';
  const format = args[2] || 'json';

  console.log('=== TED Tender Scraper ===\n');
  
  const scraper = new TEDScraper();
  
  try {
    const tenders = await scraper.search(query, scope);
    
    if (tenders.length === 0) {
      console.log('\nNo tenders found.');
      console.log('This could mean:');
      console.log('- No results match your search query');
      console.log('- The website structure has changed');
      console.log('- The results are loading via JavaScript and need more time');
      console.log('\nTip: Try opening the search URL in a browser to verify results exist');
      return;
    }

    // Display results
    console.log('\n=== Results ===\n');
    tenders.forEach((tender, index) => {
      const nameLine = tender.contractName && tender.contractName !== tender.title
        ? `${tender.title} — ${tender.contractName}`
        : tender.title;
      console.log(`${index + 1}. ${nameLine}`);
      if (tender.link) console.log(`   Link: ${tender.link}`);
      if (tender.reference) console.log(`   Reference: ${tender.reference}`);
      if (tender.contractName) console.log(`   Contract Name: ${tender.contractName}`);
      if (tender.publicationDate) console.log(`   Publication Date: ${tender.publicationDate}`);
      if (tender.deadline) console.log(`   Deadline: ${tender.deadline}`);
      if (tender.budget) console.log(`   Budget: ${tender.budget}`);
      console.log('');
    });

    // Export data
    if (format === 'json') {
      await scraper.exportToJSON(tenders);
    } else if (format === 'csv') {
      await scraper.exportToCSV(tenders);
    } else {
      await scraper.exportToJSON(tenders);
    }

  } catch (error) {
    console.error('Failed to scrape TED website:', error);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  main();
}

export { TEDScraper };
export type { TenderData };
