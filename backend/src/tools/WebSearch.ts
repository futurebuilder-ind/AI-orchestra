import { URL } from 'node:url';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      }
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed with status ${response.status}`);
    }

    const html = await response.text();
    const results: SearchResult[] = [];

    // Split HTML by result blocks to parse them separately
    const resultBlocks = html.split('<div class="result');
    
    // The first block is header metadata, we iterate from index 1
    for (let i = 1; i < resultBlocks.length; i++) {
      if (results.length >= 5) break; // Limit to top 5 results

      const block = resultBlocks[i];

      // DuckDuckGo HTML structure matches:
      // <a class="result__a" href="[URL]">[Title]</a>
      // <a class="result__snippet" ...>[Snippet]</a>
      const titleMatch = block.match(/<a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
      const snippetMatch = block.match(/<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);

      if (titleMatch) {
        let rawUrl = titleMatch[1];
        let title = titleMatch[2].replace(/<[^>]*>/g, '').trim(); // Strip HTML tags
        let snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, '').trim() : '';

        // Decode URL redirects if DuckDuckGo reroutes links:
        // e.g., //duckduckgo.com/l/?uddg=https://actualurl.com
        if (rawUrl.includes('uddg=')) {
          try {
            const cleanUrl = rawUrl.startsWith('//') ? 'https:' + rawUrl : rawUrl;
            const urlObj = new URL(cleanUrl);
            const uddg = urlObj.searchParams.get('uddg');
            if (uddg) rawUrl = uddg;
          } catch (e) {
            // URL parse failed, keep raw URL
          }
        } else if (rawUrl.startsWith('//')) {
          rawUrl = 'https:' + rawUrl;
        }

        // Skip internal DuckDuckGo links
        if (rawUrl.includes('duckduckgo.com/') && !rawUrl.includes('uddg=')) {
          continue;
        }

        // Clean HTML entities
        title = unescapeHtml(title);
        snippet = unescapeHtml(snippet);

        if (title && rawUrl) {
          results.push({
            title,
            url: rawUrl,
            snippet
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.error('Web search error:', error);
    return [];
  }
}

function unescapeHtml(safe: string): string {
  return safe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"');
}
